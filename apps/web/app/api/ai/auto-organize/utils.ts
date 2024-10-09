import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { z } from "zod";

import { createJinaEmbeddings } from "app/api/utils/embeddings";
import { heliconeOpenAI } from "app/api/utils/helicone";

export const generateNoteQueries = async (collectionTitle: string) => {
	const {
		object: { noteQueries },
	} = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
		messages: [
			{
				role: "system",
				content: `Generate probable examples of notes that would typically be found in a folder, based on the provided folder title. These notes should be suitable for use in a vector similarity search. 

# Steps

1. **Understand the Folder Title**: Analyze the given title to determine the context, subject, or theme it implies.
2. **Identify Relevant Topics**: Based on the title, list possible topics or sub-themes that would be relevant to include in the notes.
3. **Create Example Notes**: Generate notes that are likely to be found under each identified topic, maintaining thematic relevance.
   - Each note should contain a brief explanation or entry relevant to the folder title.
   - Ensure diversity among the notes to cover a broad aspect of the given theme.
4. **Ensure Consistency and Clarity**: Make sure the notes are coherent, clear, and consistent with the subject implied by the title.

# Output Format

- Provide the notes as a list or array, where each entry represents a distinct note relevant to the folder title.
- Each note should be concise, capturing key concepts or information related to the folder title.

# Examples

**Input**: "Ancient Egypt"
- Ex1: "The role of the pharaoh in Ancient Egyptian society."
- Ex2: "An overview of the religious beliefs of Ancient Egyptians."
- Ex3: "The significance of the Nile River in agriculture and trade."
(Note: Fuller examples can include 2-3 sentences detailing more complex aspects of the topic.)

**Input**: "Modern Marketing Strategies"
- Ex1: "The importance of social media in brand engagement."
- Ex2: "Emerging trends: Influencer marketing in 2023."
- Ex3: "Digital analytics tools for measuring campaign success."

# Notes

- Adapt the complexity and depth of the notes to fit the folder's theme and potential audience, whether it's intended for general understanding or expert insight.
- Ensure the notes are varied enough to be distinguished in a vector similarity search, enabling effective classification or retrieval.`,
			},
			{
				role: "user",
				content: `Folder title: ${collectionTitle}`,
			},
		],
		schema: z.object({
			noteQueries: z.array(z.string()),
		}),
	});

	return noteQueries;
};

export const queryNotes = async (
	originalQuery: string,
	noteQueries: string[],
	workspaceId: string,
	collectionId: string,
	supabase: SupabaseClient<Database>,
) => {
	// Generate query embeddings
	const queryEmbeddings = await createJinaEmbeddings(noteQueries, "query");

	if (!queryEmbeddings || queryEmbeddings.length === 0) {
		throw new Error("Failed to generate query embeddings");
	}

	// Perform embedding search

	const results = await Promise.all(
		queryEmbeddings.map(async embedding =>
			handleSupabaseError(
				await supabase.rpc("multi_embedding_thought_chunk_search", {
					query_embeddings: embedding.map(e => JSON.stringify(e)),
					match_threshold: 0.8,
					max_results: 10,
					workspace_id: workspaceId,
				}),
			),
		),
	);

	const flattenedResults = results.flat();

	const thoughtIds = new Set(flattenedResults.map(r => r.thought_id));

	// Fetch existing collection_thoughts
	const { data: existingCollectionThoughts } = await supabase
		.from("collection_thoughts")
		.select("thought_id")
		.eq("collection_id", collectionId)
		.eq("workspace_id", workspaceId);

	// Create a Set of existing thought_ids for efficient lookup
	const existingThoughtIds = new Set(existingCollectionThoughts?.map(ct => ct.thought_id));

	// Filter out thoughts that already exist in the collection
	const newCollectionThoughts = Array.from(thoughtIds)
		.filter(thoughtId => !existingThoughtIds.has(thoughtId))
		.map(thoughtId => ({
			collection_id: collectionId,
			thought_id: thoughtId,
			workspace_id: workspaceId,
		}));

	// Only insert new collection_thoughts
	if (newCollectionThoughts.length > 0) {
		await supabase.from("collection_thoughts").insert(newCollectionThoughts);
	}

	// const thoughts = handleSupabaseError(
	// 	await supabase.from("thoughts").select("title, content_md").in("id", Array.from(thoughtIds)),
	// );

	// console.log(thoughts);

	// const rerankedThoughts = await jinaReranking(
	// 	originalQuery,
	// 	thoughts.map(t => t.content_md!),
	// 	10,
	// );

	// console.log(rerankedThoughts.map(t => t.document.text));
};
