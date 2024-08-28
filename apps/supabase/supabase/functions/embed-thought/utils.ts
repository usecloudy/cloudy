import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { Database } from "../_shared/database.types.ts";

type EmbeddingRecord =
    Database["public"]["Tables"]["thought_embeddings"]["Row"];

export const generateMatchPairs = async (
    authorId: string,
    embeddingRecords: EmbeddingRecord[],
    supabase: SupabaseClient<Database>,
) => (await Promise.all(
    embeddingRecords.flatMap(async (record) => {
        const { data, error } = await supabase.rpc(
            "match_thought_chunks",
            {
                query_embedding: record.embedding,
                match_threshold: 0.5,
                match_count: 4,
                exclude_thought_id: record.thought_id,
                input_author_id: authorId,
            },
        );

        const matchedThoughtIds = Array.from(
            new Set(data?.map((d) => d.thought_id)),
        );

        console.log(
            `Matched ${data?.length} chunks for thought ${record.thought_id}: ${matchedThoughtIds}`,
        );

        if (error) {
            throw error;
        }

        return data.map((match) => ({
            thought_id: record.thought_id,
            matched_by: record.id,
            matches: match.id,
        }));
    }),
)).flat();
