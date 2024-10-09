import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { cosineSimilarity, generateObject } from "ai";
import { z } from "zod";

import { generateEmbeddings } from "app/api/utils/embeddings";
import { heliconeOpenAI } from "app/api/utils/helicone";
import { jinaRerankingWithExponentialBackoff } from "app/api/utils/reranking";
import { addSignal, removeSignal } from "app/api/utils/thoughts";

import { ThoughtRecord } from "../utils";

export const THOUGHT_EMBEDDING_MODEL = "text-embedding-3-small";

// AI Generation Functions
const generateIntent = async (thoughtRecord: ThoughtRecord) => {
	let {
		object: { intents, type: noteType },
	} = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
		system: `Generate concise single-line "type" and "intent" for a given note, determining both the category of the note and its main purpose or goal.

# Steps

1. Analyze the note to understand its context and content.
2. Determine the **type** of the note (e.g., meeting notes, interview evaluation, research summary, application, etc.).
3. Identify the primary purpose or objective of the note based on its content.
4. Formulate clear, single-line **intents** that encapsulates this purpose.

# Output Format

Provide the type of the note, its intent, and important keywords in a JSON format:

\`\`\`json
{
  "type": "[Type of the note]",
  "intents": ["[Primary purpose of the note]", "[Secondary purpose of the note]", ...]
}
\`\`\`

# Examples

**Input:** "John Doe's interview focused on his past project management experiences and his leadership skills."

**Output:**
\`\`\`json
{
  "type": "Interview Evaluation",
  "intents": ["Evaluate interviewee's project management and leadership skills", "Assess interviewee's past experiences"]
}
\`\`\`

---

**Input:** "Meeting notes from the quarterly financial review, highlighting budget allocations and expenditure trends."

**Output:**
\`\`\`json
{
  "type": "Meeting Notes",
  "intents": ["Summarize budget allocations and expenditure trends from the quarterly financial review", "Review budget allocations and expenditure trends"]
}
\`\`\`

---

**Input:** "Customer feedback report analyzing satisfaction levels and areas for product improvement."

**Output:**
\`\`\`json
{
  "type": "Customer Feedback Report",
  "intents": ["Assess customer satisfaction and identify product improvement areas", "Analyze customer feedback to improve product"]
}
\`\`\`

---

**Input:** "Research summary on the latest industry trends and their potential impact on our business strategy."

**Output:**
\`\`\`json
{
  "type": "Research Summary",
  "intents": ["Analyze industry trends and their impact on business strategy", "Identify potential business opportunities"]
}
\`\`\`

---

**Input:** "Training session notes covering using LangChain's functionalities and best practices for team usage."

**Output:**
\`\`\`json
{
  "type": "LangChain Training Session Notes",
  "intents": ["Outline new LangChain functionalities and best practices for team usage", "Assess LangChain functionalities and best practices for team usage"]
}
\`\`\`

# Notes

- Ensure that both the **type** and the **intent** are specific, clear, and directly related to the content of the note.
- Avoid vague or overly broad descriptions; focus on the key purpose and nature of the note.
- You MUST think out loud step-by-step before giving your final answer.`,
		prompt: `Title: ${thoughtRecord.title}
\`\`\`
${thoughtRecord.content_md}
\`\`\``,
		headers: {
			"Helicone-Session-Name": "Thought-intent",
		},
		schema: z.object({
			thoughts: z.array(z.string()),
			type: z.string(),
			intents: z.array(z.string()),
		}),
		temperature: 0,
	});

	return { noteType, intents: intents.map(intent => (intent.endsWith(".") ? intent.slice(0, -1) : intent)) };
};

const generateSummary = async (thoughtRecord: ThoughtRecord) => {
	const {
		object: { refinedFinalSummary },
	} = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
		system: `Generate a concise and informative summary of a document to enable effective semantic similarity analysis for grouping similar documents.

Consider the following guidelines:

- Capture the main ideas, themes, and concepts of the document.
- Avoid including specific numeric data or minute details unless they are crucial to understanding the document's context.
- Maintain coherence and logical flow, ensuring that the summary represents the original content accurately.
- Extract important keywords and phrases

# Steps

1. **Read the Document**: Thoroughly understand the content and identify key themes and ideas.
2. **Identify Core Elements**: Extract the main purpose, topics, and any critical aspects that are central to the document's content.
3. **Draft the Summary**: Write a concise text that encompasses the extracted core elements. Ensure clarity and preserve the document's original intent.
4. **Review and Edit**: Ensure that the summary is logically structured and sufficiently informative for semantic similarity analysis.`,
		prompt: `Title: ${thoughtRecord.title}
\`\`\`
${thoughtRecord.content_md}
\`\`\``,
		headers: {
			"Helicone-Session-Name": "Thought-summary",
		},
		schema: z.object({
			thoughts: z.array(z.string()),
			draftSummary: z.string(),
			refinedFinalSummary: z.string(),
		}),
		temperature: 0,
	});

	return refinedFinalSummary;
};

// Helper Functions
const makeEmbeddingInput = (
	noteType: string | null | undefined,
	intent: string,
	summary: string,
	contentMd: string,
): string => {
	return `${noteType ? noteType + ";\n" : ""}${intent}; ${summary};\n${contentMd.slice(0, 4096)}`;
};

const makeRerankerInput = (noteType: string | null | undefined, intent: string, summary: string, contentMd: string): string => {
	return `${noteType ? noteType + ";\n" : ""}${intent}; ${summary};\n${contentMd}`;
};

// Main Functions
export const generateIntentSummaryAndEmbedding = async (
	thoughtRecord: ThoughtRecord,
	editDistance: number,
	supabase: SupabaseClient<Database>,
	force?: boolean,
) => {
	let noteType: string, intents: string[], summary: string;
	if (
		!force &&
		thoughtRecord.generated_intents.length > 0 &&
		thoughtRecord.generated_summary &&
		thoughtRecord.generated_type &&
		editDistance < 256
	) {
		noteType = thoughtRecord.generated_type;
		intents = thoughtRecord.generated_intents;
		summary = thoughtRecord.generated_summary;
	} else {
		if (!thoughtRecord.content_md || thoughtRecord.content_md.length < 36) {
			throw new Error("Content too short");
		}

		[{ noteType, intents }, summary] = await Promise.all([generateIntent(thoughtRecord), generateSummary(thoughtRecord)]);
	}

	const mainIntent = intents[0];
	if (!mainIntent) {
		throw new Error("No main intent");
	}

	const embeddingInput = makeEmbeddingInput(noteType, mainIntent, summary, thoughtRecord.content_md!);
	const embeddings = await generateEmbeddings([embeddingInput], THOUGHT_EMBEDDING_MODEL);

	if (!embeddings) {
		throw new Error("No embeddings");
	}

	handleSupabaseError(
		await supabase
			.from("thoughts")
			.update({ generated_type: noteType, generated_summary: summary, generated_intents: intents, embeddings_version: 2 })
			.eq("id", thoughtRecord.id),
	);
	handleSupabaseError(await supabase.from("thought_summary_embeddings").delete().eq("thought_id", thoughtRecord.id));
	handleSupabaseError(
		await supabase.from("thought_summary_embeddings").insert({
			thought_id: thoughtRecord.id,
			embedding: JSON.stringify(embeddings[0]),
		}),
	);

	return { embedding: embeddings[0], intents, summary };
};

interface SimilarThought {
	thought_id: string;
	similarity_score: number;
}

const getSimilarThoughts = async (
	thoughtRecord: ThoughtRecord,
	supabase: SupabaseClient<Database>,
): Promise<SimilarThought[]> => {
	const { embedding } = handleSupabaseError(
		await supabase.from("thought_summary_embeddings").select("embedding").eq("thought_id", thoughtRecord.id).single(),
	);

	return handleSupabaseError(
		await supabase.rpc("embedding_thought_summary_search", {
			query_embedding: embedding,
			match_threshold: 0.25,
			max_results: 36,
			p_workspace_id: thoughtRecord.workspace_id!,
			ignore_thought_ids: [thoughtRecord.id],
		}),
	);
};

interface FilteredThought {
	id: string;
	title: string;
	content_md: string;
	generated_intents: string[];
	generated_summary: string;
	generated_type: string;
	collection_thoughts: Array<{ collections: { id: string } | null }>;
	workspace_id: string;
}

const getFilteredThoughts = async (
	similarThoughts: SimilarThought[],
	supabase: SupabaseClient<Database>,
	currentThoughtId: string,
): Promise<FilteredThought[]> => {
	const thoughts = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select(
				"id,title,content_md,generated_intents,generated_summary,generated_type,collection_thoughts(collections(id)), workspace_id",
			)
			.in(
				"id",
				similarThoughts.map(t => t.thought_id),
			),
	);

	return thoughts.filter(
		t => t.id !== currentThoughtId && t.generated_intents.length > 0 && t.generated_summary && t.content_md,
	) as FilteredThought[];
};

interface ThoughtWithScore extends FilteredThought {
	similarity_score: number;
}

const updateThoughtRelations = async (
	thoughtRecord: ThoughtRecord,
	filteredThoughtsWithScore: ThoughtWithScore[],
	supabase: SupabaseClient<Database>,
): Promise<void> => {
	handleSupabaseError(await supabase.from("thought_relations").delete().eq("matched_by", thoughtRecord.id));
	handleSupabaseError(await supabase.from("thought_relations").delete().eq("matches", thoughtRecord.id));

	handleSupabaseError(
		await supabase.from("thought_relations").upsert(
			filteredThoughtsWithScore.map(t => ({
				matched_by: thoughtRecord.id < t.id ? thoughtRecord.id : t.id,
				matches: thoughtRecord.id < t.id ? t.id : thoughtRecord.id,
				similarity_score: t.similarity_score,
			})),
			{ onConflict: "matched_by,matches", ignoreDuplicates: true },
		),
	);
};

interface CollectionScore {
	collectionId: string;
	meanScore: number;
}

const calculateCollectionScores = (filteredThoughtsWithScore: ThoughtWithScore[]): CollectionScore[] => {
	const collectionScores = new Map<string, number[]>();
	filteredThoughtsWithScore.forEach(thought =>
		thought.collection_thoughts.forEach(collectionThought => {
			if (collectionThought.collections?.id) {
				if (collectionScores.has(collectionThought.collections.id)) {
					collectionScores.get(collectionThought.collections.id)?.push(thought.similarity_score);
				} else {
					collectionScores.set(collectionThought.collections.id, [thought.similarity_score]);
				}
			}
		}),
	);
	return Array.from(collectionScores.entries()).map(([collectionId, scores]) => ({
		collectionId,
		meanScore: scores.reduce((a, b) => a + b, 0) / scores.length,
	}));
};

interface CollectionIntentEmbedding {
	id: string;
	intent_embedding: string | null;
}

interface RelevantCollection {
	collection_id: string;
	similarity_score: number;
}

interface SuggestedCollections {
	collectionIntentEmbeddings: CollectionIntentEmbedding[];
	intentOnlyEmbeddings: number[][];
	relevantCollectionIdsAndScores: RelevantCollection[];
}

const getSuggestedCollections = async (
	thoughtRecord: ThoughtRecord,
	meanCollectionScores: CollectionScore[],
	supabase: SupabaseClient<Database>,
): Promise<SuggestedCollections> => {
	const potentialCollectionIds = meanCollectionScores
		.filter(
			score =>
				score.meanScore > 0.4 &&
				!(thoughtRecord.ignored_collection_suggestions as string[] | null)?.includes(score.collectionId),
		)
		.sort((a, b) => b.meanScore - a.meanScore)
		.map(score => score.collectionId);

	const collectionIntentEmbeddings = handleSupabaseError(
		await supabase.from("collections").select("id,intent_embedding").in("id", potentialCollectionIds),
	);

	const intentOnlyEmbeddings = await generateEmbeddings(thoughtRecord.generated_intents, THOUGHT_EMBEDDING_MODEL);
	const relevantCollectionIdsAndScores = (
		await Promise.all(
			intentOnlyEmbeddings.map(async embedding =>
				handleSupabaseError(
					await supabase.rpc("embedding_collection_intent_search", {
						query_embedding: JSON.stringify(embedding),
						match_threshold: 0.4,
						max_results: 4,
						p_workspace_id: thoughtRecord.workspace_id!,
					}),
				),
			),
		)
	).flat();

	return { collectionIntentEmbeddings, intentOnlyEmbeddings, relevantCollectionIdsAndScores };
};

export const mapRelationshipsForThought = async (
	thoughtRecord: ThoughtRecord,
	supabase: SupabaseClient<Database>,
): Promise<void> => {
	const {
		generated_intents: intents,
		generated_summary: summary,
		generated_type: noteType,
		content_md: contentMd,
	} = thoughtRecord;
	if (intents.length === 0 || !summary || !contentMd) {
		throw new Error("No intent, summary, or content_md");
	}

	const similarThoughts = await getSimilarThoughts(thoughtRecord, supabase);

	if (similarThoughts.length === 0) {
		await updateThoughtRelations(thoughtRecord, [], supabase);
		return;
	}

	const filteredThoughts = await getFilteredThoughts(similarThoughts, supabase, thoughtRecord.id);

	const rerankedSimilarThoughts = await jinaRerankingWithExponentialBackoff(
		makeRerankerInput(noteType, intents[0]!, summary, contentMd.slice(0, 4096)),
		filteredThoughts.map(t =>
			makeRerankerInput(t.generated_type, t.generated_intents[0]!, t.generated_summary!, t.content_md!.slice(0, 4096)),
		),
		36,
	);

	const filteredThoughtsWithScore: ThoughtWithScore[] = rerankedSimilarThoughts
		.map(t => ({
			...filteredThoughts[t.index]!,
			similarity_score: t.relevance_score,
		}))
		.filter(t => t.similarity_score > 0.35)
		.sort((a, b) => b.similarity_score - a.similarity_score);

	await updateThoughtRelations(thoughtRecord, filteredThoughtsWithScore, supabase);

	const meanCollectionScores = calculateCollectionScores(filteredThoughtsWithScore);

	console.log("Mean collection scores", meanCollectionScores);

	const { collectionIntentEmbeddings, intentOnlyEmbeddings, relevantCollectionIdsAndScores } = await getSuggestedCollections(
		thoughtRecord,
		meanCollectionScores,
		supabase,
	);

	console.log("Relevant collection ids and scores", relevantCollectionIdsAndScores);

	const finalCollectionIdsToSuggest = new Set<string>(
		relevantCollectionIdsAndScores.map(collection => collection.collection_id),
	);

	collectionIntentEmbeddings.forEach(collection => {
		if (collection.intent_embedding) {
			const similarity = cosineSimilarity(intentOnlyEmbeddings[0]!, JSON.parse(collection.intent_embedding) as number[]);
			if (similarity > 0.4) {
				finalCollectionIdsToSuggest.add(collection.id);
			}
		}
	});

	console.log("Final collection suggestions", finalCollectionIdsToSuggest);

	handleSupabaseError(
		await supabase
			.from("thoughts")
			.update({ collection_suggestions: Array.from(finalCollectionIdsToSuggest) })
			.eq("id", thoughtRecord.id),
	);
};

export const intentSummaryEmbeddingPipeline = async (
	thoughtRecord: ThoughtRecord,
	editDistance: number,
	supabase: SupabaseClient<Database>,
	force?: boolean,
) => {
	if (!thoughtRecord.content_md) {
		return;
	}

	await addSignal(ThoughtSignals.EMBEDDING_UPDATE, thoughtRecord.id, supabase);

	try {
		await generateIntentSummaryAndEmbedding(thoughtRecord, editDistance, supabase, force);

		const newThoughtRecord = handleSupabaseError(
			await supabase.from("thoughts").select("*").eq("id", thoughtRecord.id).single(),
		);
		await mapRelationshipsForThought(newThoughtRecord, supabase);
	} finally {
		await removeSignal(ThoughtSignals.EMBEDDING_UPDATE, thoughtRecord.id, supabase);
	}
};
