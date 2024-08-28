import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { crypto } from "jsr:@std/crypto/crypto";
import { encodeHex } from "jsr:@std/encoding/hex";
import { Database } from "./database.types.ts";

type RelatedChunk = Pick<
    Database["public"]["Tables"]["thought_embeddings"]["Row"],
    "id" | "hash" | "index" | "thought_id"
>;

export interface MarkdownChunk {
    chunk: string;
    hash: string;
}

export const chunkMarkdown = (
    mdContent: string,
    maxChunkSize: number = 1000,
): string[] => {
    const lines = mdContent.split("\n");
    const chunks: string[] = [];
    let currentChunk = "";

    const addToChunk = (line: string) => {
        if (
            currentChunk.length + line.length > maxChunkSize &&
            currentChunk.length > 0
        ) {
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

export const hashChunk = async (chunk: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(chunk);

    const hash = await crypto.subtle.digest("MD5", data);

    return encodeHex(hash);
};

export const chunkAndHashMarkdown = async (
    mdContent: string,
): Promise<MarkdownChunk[]> => {
    const chunks = chunkMarkdown(mdContent);
    const chunkHashes = await Promise.all(chunks.map(hashChunk));

    return chunks.map((chunk, index) => ({
        chunk,
        hash: chunkHashes[index],
    }));
};

export const getRelatedChunks = async (
    thoughtId: string,
    supabase: SupabaseClient<Database>,
): Promise<RelatedChunk[]> => {
    console.log(`Getting related chunks for thought ${thoughtId}`);

    const { data: currentChunks, error: currentChunksError } = await supabase
        .from("thought_embeddings")
        .select("id")
        .eq("thought_id", thoughtId);

    if (currentChunksError) {
        throw currentChunksError;
    }

    console.log(
        `Found ${currentChunks?.length} current chunks`,
        currentChunks.map((chunk) => chunk.id),
    );

    // Get related chunks via the join table
    const { data: relatedChunksData, error: relatedChunksError } =
        await supabase
            .from("thought_embedding_matches")
            .select(
                "thought_embeddings!matches(id, thought_id, index, hash)",
            )
            .in("matched_by", currentChunks.map((chunk) => chunk.id));

    if (relatedChunksError) {
        throw relatedChunksError;
    }

    console.log(`Found ${relatedChunksData?.length} related chunks`);

    // Extract and deduplicate the related chunks
    const relatedChunks = Array.from(
        new Set(
            relatedChunksData
                .flatMap((match) =>
                    match.thought_embeddings ? match.thought_embeddings : []
                )
                .filter(Boolean),
        ),
    );

    return relatedChunks;
};

export const getRelatedChunkContents = async (
    relatedChunks: RelatedChunk[],
    supabase: SupabaseClient<Database>,
) => {
    const relatedChunkHashes = new Set(
        relatedChunks.map((chunk) => chunk.hash),
    );
    const relatedThoughtIds = relatedChunks.map((chunk) => chunk.thought_id);
    const { data: relatedThoughts, error: relatedThoughtsError } =
        await supabase.from("thoughts").select("id, content_md").in(
            "id",
            relatedThoughtIds,
        );

    if (relatedThoughtsError) {
        throw relatedThoughtsError;
    }

    console.log(`Found ${relatedThoughts?.length} related thoughts`);

    const relatedChunkContents = (await Promise.all(
        relatedThoughts.flatMap(async (thought) => {
            if (!thought.content_md) {
                return [];
            }

            const chunks = await chunkAndHashMarkdown(thought.content_md);

            return chunks.filter((chunk) => relatedChunkHashes.has(chunk.hash));
        }),
    )).flat();

    return relatedChunkContents;
};

export const getRelatedChunkContentsForThought = async (
    thoughtId: string,
    supabase: SupabaseClient<Database>,
) => {
    const relatedChunks = await getRelatedChunks(thoughtId, supabase);
    const relatedChunkContents = await getRelatedChunkContents(
        relatedChunks,
        supabase,
    );
    return relatedChunkContents;
};
