// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.55.4/mod.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { chunkAndHashMarkdown } from "../_shared/chunking.ts";
import { Database } from "../_shared/database.types.ts";
import { generateMatchPairs } from "./utils.ts";

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: Database["public"]["Tables"]["thoughts"]["Row"];
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: Database["public"]["Tables"]["thoughts"]["Row"];
	old_record: Database["public"]["Tables"]["thoughts"]["Row"];
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: Database["public"]["Tables"]["thoughts"]["Row"];
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

Deno.serve(async (req) => {
	const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
	if (!openaiApiKey) {
		throw new Error("OPENAI_API_KEY is required");
	}
	const supabaseUrl = Deno.env.get("SUPABASE_URL");
	if (!supabaseUrl) {
		throw new Error("SUPABASE_URL is required");
	}
	const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
	if (!supabaseServiceRoleKey) {
		throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
	}

	const payload: Payload = await req.json();

	const supabase = createClient<Database>(
		supabaseUrl,
		supabaseServiceRoleKey,
	);

	if (payload.type == "DELETE") {
		return new Response(
			JSON.stringify({ message: "DELETE not supported" }),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	console.log("Will embed thought", payload.record.id);

	const { data, error } = await supabase.from("thoughts").select(
		"id, content_md, embeddings_version, author_id",
	).eq("id", payload.record.id).single();

	console.log("for author_id", data?.author_id);

	if (error) {
		return new Response(
			JSON.stringify(error),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	const contentMd = data.content_md;

	if (!contentMd) {
		return new Response(
			JSON.stringify({ message: "No content_md" }),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	if (contentMd.length < 3) {
		console.log("Content too short");
		return new Response(
			JSON.stringify({ message: "Content too short" }),
			{ headers: { "Content-Type": "application/json" } },
		);
	}

	const chunks = await chunkAndHashMarkdown(contentMd);

	console.log("Successfully chunked");

	const { data: existingEmbeddings } = await supabase.from(
		"thought_embeddings",
	)
		.select("*").eq("thought_id", data.id).order("index", {
			ascending: true,
		});

	console.log(
		`Found ${existingEmbeddings?.length} existing embeddings for thought ${data.id}`,
	);

	// We find the first chunk that has a different hash than the existing embedding
	// This is the index of the first chunk that we need to re-embed
	let reEmbedFromIndex = 0;
	if (existingEmbeddings) {
		for (const existingEmbedding of existingEmbeddings) {
			const index = existingEmbedding.index;
			const existingHash = existingEmbedding.hash;

			if (chunks[index].hash !== existingHash) {
				break;
			}

			reEmbedFromIndex++;
		}
	}

	const chunksToEmbed = chunks.slice(reEmbedFromIndex);

	const totalEmbeddingsToDelete = existingEmbeddings?.length
		? existingEmbeddings.length - reEmbedFromIndex
		: 0;
	console.log(
		`Deleting ${totalEmbeddingsToDelete} existing embeddings for thought ${data.id} from index ${reEmbedFromIndex}`,
	);

	const openai = new OpenAI({
		apiKey: openaiApiKey,
	});

	console.log(`Will embed ${chunksToEmbed.length} chunks.`);

	if (chunksToEmbed.length > 0) {
		const embeddings = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: chunksToEmbed.map((chunk) => chunk.chunk),
		});

		await supabase.from("thought_embeddings").delete().eq(
			"thought_id",
			data.id,
		).gte("index", reEmbedFromIndex);

		await supabase.from("thought_embeddings").insert(
			embeddings.data.map((embedding, index) => {
				const chunkHash = chunksToEmbed[index].hash;

				return {
					thought_id: data.id,
					embedding: JSON.stringify(embedding.embedding),
					index: index + reEmbedFromIndex,
					hash: chunkHash,
				};
			}),
		);

		console.log("Successfully embedded thought", payload.record.id);
	} else {
		console.log("No chunks to embed");
	}

	const { data: embeddingRecords, error: embeddingError } = await supabase
		.from("thought_embeddings").select("*").eq("thought_id", data.id);

	if (embeddingError) {
		throw new Error("Error getting embedding records");
	}

	if (!embeddingRecords) {
		throw new Error("No embedding records found");
	}

	const matchPairs = await generateMatchPairs(
		data.author_id,
		embeddingRecords,
		supabase,
	);
	console.log(`Generated ${matchPairs.length} match pairs`);

	const { data: deletedMatchPairs } = await supabase.from(
		"thought_embedding_matches",
	).delete().eq(
		"thought_id",
		data.id,
	).select();

	console.log(`Deleted ${deletedMatchPairs?.length} match pairs`);

	await supabase.from("thought_embedding_matches").insert(matchPairs);

	console.log("Successfully generated match pairs");

	return new Response(
		JSON.stringify({ success: true }),
		{ headers: { "Content-Type": "application/json" } },
	);
});
