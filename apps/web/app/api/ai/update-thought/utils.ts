import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export type ThoughtRecord = Database["public"]["Tables"]["thoughts"]["Row"];

export const generateMatchPairs = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	const embeddingRecords = handleSupabaseError(
		await supabase.from("thought_embeddings").select("*").eq("thought_id", thoughtRecord.id),
	);

	const matchPairs = (
		await Promise.all(
			embeddingRecords.flatMap(async record => {
				const { data, error } = await supabase.rpc("match_thought_chunks", {
					query_embedding: record.embedding,
					match_threshold: 0.4,
					match_count: 4,
					exclude_thought_id: record.thought_id,
					input_workspace_id: thoughtRecord.workspace_id!,
				});

				const matchedThoughtIds = Array.from(new Set(data?.map(d => d.thought_id)));

				console.log(`Matched ${data?.length} chunks for thought ${record.thought_id}: ${matchedThoughtIds}`);

				if (error) {
					throw error;
				}

				return data.map(match => ({
					thought_id: record.thought_id,
					matched_by: record.id,
					matches: match.id,
					matches_thought_id: match.thought_id,
					similarity: match.similarity,
				}));
			}),
		)
	).flat();

	console.log(`Generated ${matchPairs.length} match pairs`);

	const { data: updatedMatchPairs, error: updateError } = await supabase.rpc("update_thought_embedding_matches", {
		p_thought_id: thoughtRecord.id,
		p_match_pairs: matchPairs,
	});

	if (updateError) {
		console.error("Error updating match pairs:", updateError);
		throw updateError;
	}

	console.log(`Updated ${updatedMatchPairs?.length} match pairs`);

	// Group match pairs by collection
	const collectionSimilarities = new Map<string, number[]>();
	for (const pair of matchPairs) {
		const { data: collectionThoughts } = await supabase
			.from("collection_thoughts")
			.select("collection_id")
			.eq("thought_id", pair.matches_thought_id)
			.single();

		console.log(`Collection thoughts: ${JSON.stringify(pair)} ${JSON.stringify(collectionThoughts)}`);

		if (collectionThoughts) {
			const { collection_id } = collectionThoughts;
			if (!collectionSimilarities.has(collection_id)) {
				collectionSimilarities.set(collection_id, []);
			}
			collectionSimilarities.get(collection_id)!.push(pair.similarity);
		}
	}

	console.log(`Collection similarities: ${JSON.stringify(collectionSimilarities)}`);

	// Calculate average similarity for each collection
	const collectionAverageSimilarities = Array.from(collectionSimilarities.entries()).map(([collectionId, similarities]) => ({
		collectionId,
		averageSimilarity: similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length,
	}));

	console.log(`Collection average similarities: ${collectionAverageSimilarities}`);

	const suggestedCollections = collectionAverageSimilarities
		.filter(
			item =>
				item.averageSimilarity > 0.5 &&
				!(thoughtRecord.ignored_collection_suggestions as string[] | null)?.includes(item.collectionId),
		)
		.sort((a, b) => b.averageSimilarity - a.averageSimilarity)
		.map(({ collectionId }) => collectionId);

	console.log(`Suggested ${suggestedCollections.length} collections for thought ${thoughtRecord.id}`);

	// Update the thought with suggested collections
	handleSupabaseError(
		await supabase.from("thoughts").update({ collection_suggestions: suggestedCollections }).eq("id", thoughtRecord.id),
	);
	console.log(`Updated thought ${thoughtRecord.id} with suggested collections`);
};

export const markThoughtAsProcessing = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	await supabase.from("thoughts").update({ suggestion_status: "processing" }).eq("id", thoughtId);
};

export const markThoughtProcessingAsDone = async (
	thoughtId: string,
	supabase: SupabaseClient<Database>,
	thoughtContentMd?: string | null,
) => {
	handleSupabaseError(
		await supabase
			.from("thoughts")
			.update({ suggestion_status: "idle", ...(thoughtContentMd && { last_suggestion_content_md: thoughtContentMd }) })
			.eq("id", thoughtId),
	);
};
