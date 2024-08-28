import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

import { Database } from "../_shared/database.types.ts";
import { generateQueryEmbeddings } from "../_shared/embeddings.ts";

export const queryThoughts = async (
    prompt: string,
    authorId: string,
    supabase: SupabaseClient<Database>,
    collectionId?: string,
) => {
    const promptEmbeddings = await generateQueryEmbeddings(prompt);

    if (!promptEmbeddings) {
        throw new Error("Failed to generate prompt embedding");
    }

    const similarThoughts = await Promise.all(
        promptEmbeddings.map((promptEmbedding) => {
            return supabase.rpc(
                "match_thoughts",
                {
                    query_embedding: JSON.stringify(promptEmbedding),
                    match_threshold: 0.4,
                    match_count: 8,
                    author_id: authorId,
                    collection_id: collectionId,
                },
            );
        }),
    ).then((results) => {
        return results.flatMap((result) => result.data ?? []);
    });

    console.log(similarThoughts);

    const thoughtIds = Array.from(
        new Set(similarThoughts.map((thought) => thought.thought_id)),
    );

    const { data: thoughts, error: thoughtsError } = await supabase.from(
        "thoughts",
    ).select("*").in("id", thoughtIds);
    if (thoughtsError) {
        throw new Error(thoughtsError.message);
    }

    return thoughts;
};
