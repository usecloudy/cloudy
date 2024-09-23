import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import { createJinaEmbeddings } from "app/api/utils/embeddings";
import { heliconeAnthropic } from "app/api/utils/helicone";
import { chunkAndHashMarkdown } from "app/api/utils/relatedChunks";

export const embedThought = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("*").eq("id", thoughtId).single());

	const contentMd = thought.content_md;

	if (!contentMd) {
		console.log(`No content to embed for thought ${thoughtId}`);
		return;
	}

	const existingChunks = handleSupabaseError(await supabase.from("thought_chunks").select("*").eq("thought_id", thoughtId));

	const { chunks, version } = chunkAndHashMarkdown(contentMd);

	const existingChunkHashes = new Set(existingChunks.map(c => c.hash));
	const newChunkHashes = new Set(chunks.map(c => c.hash));

	const newChunksToAdd = chunks.filter(c => !existingChunkHashes.has(c.hash));
	const chunksToDelete = existingChunks.filter(c => !newChunkHashes.has(c.hash));

	if (newChunksToAdd.length === 0 && chunksToDelete.length === 0) {
		console.log(`No new chunks to add or chunks to delete for thought ${thoughtId}`);
		return;
	}

	const newChunksWithContext = await Promise.all(
		newChunksToAdd.map(async chunk => {
			const { text } = await generateText({
				model: heliconeAnthropic.languageModel("claude-3-5-sonnet-20240620", { cacheControl: true }),
				messages: [
					{
						role: "system",
						content: `<document title="${thought.title}">
${contentMd}
</document>`,
					},
					{
						role: "system",
						content: `Here is the chunk we want to situate within the whole document 
<chunk> 
${chunk.chunk}
</chunk>`,
						experimental_providerMetadata: {
							anthropic: { cacheControl: { type: "ephemeral" } },
						},
					},
					{
						role: "user",
						content: `Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.`,
					},
				],
				temperature: 0,
				maxRetries: 5,
			});

			return {
				...chunk,
				context: text,
			};
		}),
	);

	const embeddings =
		newChunksWithContext.length > 0
			? await createJinaEmbeddings(newChunksWithContext.map(c => makeContextualizedEmbeddingInput(c.chunk, c.context)))
			: [];

	const chunksWithEmbeddings = newChunksWithContext.map((c, index) => ({
		...c,
		embeddings: embeddings[index] ?? [],
	}));

	if (chunksToDelete.length > 0) {
		await supabase
			.from("thought_chunks")
			.delete()
			.in(
				"id",
				chunksToDelete.map(c => c.id),
			);
	}

	if (chunksWithEmbeddings.length > 0) {
		const insertedChunkIds = handleSupabaseError(
			await supabase
				.from("thought_chunks")
				.insert(
					chunksWithEmbeddings.map(chunk => ({
						// content_updated_at: thought.updated_at,
						context: chunk.context,
						content: chunk.chunk,
						hash: chunk.hash,
						thought_id: thoughtId,
					})),
				)
				.select("id"),
		);

		await supabase.from("thought_chunk_multi_embeddings").insert(
			chunksWithEmbeddings.flatMap((chunk, index) =>
				chunk.embeddings.map((embedding, tokenIndex) => ({
					chunk_id: insertedChunkIds[index]!.id,
					embedding: JSON.stringify(embedding),
					token_index: tokenIndex,
				})),
			),
		);
	}

	await supabase
		.from("thoughts")
		.update({
			embeddings_version: version,
		})
		.eq("id", thoughtId);

	console.log(
		`Refreshed multi embeddings for thought ${thoughtId}, deleted ${chunksToDelete.length} chunks and added ${chunksWithEmbeddings.length} new chunks`,
	);
};

const makeContextualizedEmbeddingInput = (chunk: string, context: string) => {
	return `${context}; ${chunk.trim()}`;
};
