import { openai } from "@ai-sdk/openai";
import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { distance } from "fastest-levenshtein";
import { NextRequest, NextResponse } from "next/server";

import { chunkAndHashMarkdown } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";
import { addSignal, checkForSignal, removeSignal } from "app/api/utils/thoughts";

import { ideateThought } from "./ideate/route";
import { Payload, ThoughtRecord, generateMatchPairs } from "./utils";

const MINIMUM_CONTENT_LENGTH = 3;
const MINIMUM_EDIT_DISTANCE = 64;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	if (payload.type === "DELETE") {
		return new Response(JSON.stringify({ message: "DELETE not supported" }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	if (
		payload.type === "UPDATE" &&
		payload.record.content === payload.old_record.content &&
		payload.record.is_suggestion_paused === payload.old_record.is_suggestion_paused
	) {
		return new Response(JSON.stringify({ message: "No content changes" }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	const isUnpauseTrigger =
		payload.type === "UPDATE" && !payload.record.is_suggestion_paused && payload.old_record.is_suggestion_paused;
	return processThought(payload.record, supabase, { isUnpauseTrigger });
};

const processThought = async (
	thoughtRecord: ThoughtRecord,
	supabase: SupabaseClient<Database>,
	options?: { isUnpauseTrigger?: boolean },
) => {
	const { content_md: contentMd, last_suggestion_content_md: lastContentMd } = thoughtRecord;

	if (!contentMd) {
		return new Response(JSON.stringify({ message: "No content_md" }), { headers: { "Content-Type": "application/json" } });
	}

	if (contentMd.length < MINIMUM_CONTENT_LENGTH) {
		console.log("Content too short");
		return NextResponse.json({ message: "Content too short" });
	}

	if (!options?.isUnpauseTrigger && lastContentMd) {
		const editDistance = distance(contentMd, lastContentMd);

		if (editDistance < MINIMUM_EDIT_DISTANCE) {
			console.log("Content too similar");
			return NextResponse.json({ message: "Content too similar" });
		}
	}

	if (await checkForSignal(ThoughtSignals.AI_THOUGHT_UPDATE, thoughtRecord.id, supabase)) {
		return NextResponse.json({ message: "Already processing" });
	}

	console.log(`Processing thought ${thoughtRecord.id}`);

	await addSignal(ThoughtSignals.AI_THOUGHT_UPDATE, thoughtRecord.id, supabase);

	try {
		await Promise.all([ideateThought(thoughtRecord, supabase), generateEmbeddings(thoughtRecord, supabase)]);

		await supabase.from("thoughts").update({ last_suggestion_content_md: contentMd }).eq("id", thoughtRecord.id);
	} finally {
		await removeSignal(ThoughtSignals.AI_THOUGHT_UPDATE, thoughtRecord.id, supabase);
	}

	return NextResponse.json({ message: "Success" });
};

const generateEmbeddings = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	await addSignal(ThoughtSignals.EMBEDDING_UPDATE, thoughtRecord.id, supabase);
	try {
		const { content_md: contentMd } = thoughtRecord;

		if (!contentMd) {
			throw new Error("No content_md");
		}

		const chunks = await chunkAndHashMarkdown(contentMd);

		console.log(`Generated ${chunks.length} chunks for thought ${thoughtRecord.id}`);

		const existingEmbeddings = handleSupabaseError(
			await supabase.from("thought_embeddings").select("*").eq("thought_id", thoughtRecord.id).order("index", {
				ascending: true,
			}),
		);

		console.log(`Found ${existingEmbeddings?.length} existing embeddings for thought ${thoughtRecord.id}`);

		// We find the first chunk that has a different hash than the existing embedding
		// This is the index of the first chunk that we need to re-embed
		let reEmbedFromIndex = 0;
		if (existingEmbeddings) {
			for (const existingEmbedding of existingEmbeddings) {
				const index = existingEmbedding.index;
				const existingHash = existingEmbedding.hash;

				if (index >= chunks.length) {
					break;
				}

				if (chunks[index]?.hash !== existingHash) {
					break;
				}

				reEmbedFromIndex++;
			}
		}

		const chunksToEmbed = chunks.slice(reEmbedFromIndex);

		const totalEmbeddingsToDelete = existingEmbeddings?.length ? existingEmbeddings.length - reEmbedFromIndex : 0;

		if (chunksToEmbed.length > 0) {
			const { embeddings } = await embedMany({
				model: openai.embedding("text-embedding-3-small"),
				values: chunksToEmbed.map(chunk => chunk.chunk),
				experimental_telemetry: {
					isEnabled: true,
				},
			});

			console.log(
				`Deleting ${totalEmbeddingsToDelete} existing embeddings for thought ${thoughtRecord.id} from index ${reEmbedFromIndex}`,
			);

			await supabase
				.from("thought_embeddings")
				.delete()
				.eq("thought_id", thoughtRecord.id)
				.gte("index", reEmbedFromIndex);

			await supabase.from("thought_embeddings").insert(
				embeddings.map((embedding, index) => {
					const chunkHash = chunksToEmbed[index]!.hash;

					return {
						thought_id: thoughtRecord.id,
						embedding: JSON.stringify(embedding),
						index: index + reEmbedFromIndex,
						hash: chunkHash,
					};
				}),
			);
		} else {
			console.log(`No chunks to embed for thought ${thoughtRecord.id}`);
			if (existingEmbeddings) {
				console.log(`Deleting ${existingEmbeddings.length} existing embeddings for thought ${thoughtRecord.id}`);

				await supabase
					.from("thought_embeddings")
					.delete()
					.eq("thought_id", thoughtRecord.id)
					.gte("index", reEmbedFromIndex);
			}
		}

		console.log(`Successfully embedded ${chunksToEmbed.length} chunks for thought ${thoughtRecord.id}`);

		await generateMatchPairs(thoughtRecord, supabase);
	} finally {
		await removeSignal(ThoughtSignals.EMBEDDING_UPDATE, thoughtRecord.id, supabase);
	}
};
