import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

type RelatedChunk = Pick<Database["public"]["Tables"]["thought_embeddings"]["Row"], "id" | "hash" | "index" | "thought_id">;

export interface MarkdownChunk {
	chunk: string;
	hash: string;
}

export const chunkMarkdown = (mdContent: string, maxChunkSize: number = 1000): string[] => {
	const lines = mdContent.split("\n");
	const chunks: string[] = [];
	let currentChunk = "";

	const addToChunk = (line: string) => {
		if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
			chunks.push(currentChunk.trim());
			currentChunk = "";
		}
		currentChunk += line + "\n";
	};

	let inCodeBlock = false;
	for (const line of lines) {
		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
			addToChunk(line);
		} else if (inCodeBlock) {
			addToChunk(line);
		} else if (line.startsWith("#")) {
			if (currentChunk.trim().length > 0) {
				chunks.push(currentChunk.trim());
				currentChunk = "";
			}
			addToChunk(line);
		} else {
			addToChunk(line);
		}
	}

	if (currentChunk.trim().length > 0) {
		chunks.push(currentChunk.trim());
	}

	return chunks;
};

export const hashChunk = (chunk: string) => {
	const hash = createHash("md5");
	hash.update(chunk);
	return hash.digest("hex");
};

export const chunkAndHashMarkdown = async (mdContent: string): Promise<MarkdownChunk[]> => {
	const chunks = chunkMarkdown(mdContent);
	const chunkHashes = chunks.map(hashChunk);

	return chunks.map((chunk, index) => ({
		chunk,
		hash: chunkHashes[index]!,
	}));
};

export const getRelatedThoughts = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	const data = handleSupabaseError(
		await supabase
			.from("thought_embedding_matches")
			.select(
				`
				id,
				thought:thoughts!matches_thought_id (
					id,
					title,
					contentMd:content_md,
					updated_at
				)
			`,
			)
			.eq("thought_id", thoughtId),
	).flatMap(d => d.thought);

	return data;
};
