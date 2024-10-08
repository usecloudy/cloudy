import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { z } from "zod";

import { generateEmbeddings } from "app/api/utils/embeddings";
import { heliconeOpenAI } from "app/api/utils/helicone";
import { jinaRerankingWithExponentialBackoff } from "app/api/utils/reranking";
import { addSignal, removeSignal } from "app/api/utils/thoughts";

import { ThoughtRecord } from "../utils";

const generateIntent = async (thoughtRecord: ThoughtRecord) => {
	let {
		object: { intent },
	} = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
		system: `Generate a concise single-line "intent" for a given note, determining the main purpose or goal of the note content.

# Steps

1. Analyze the note to understand its context and content.
2. Determine the primary purpose or objective of the note based on its content.
3. Formulate a clear, single-line intent that encapsulates this purpose.

# Output Format

- A single line of text that clearly states the intent of the note.

# Examples

**Input:** "John Doe's interview focused on his past project management experiences and his leadership skills."

**Output:** "Evaluate interviewee's project management and leadership skills."

**Input:** "Meeting notes from the quarterly financial review, highlighting budget allocations and expenditure trends."

**Output:** "Summarize budget allocations and expenditure trends from the quarterly financial review."

**Input:** "Customer feedback report analyzing satisfaction levels and areas for product improvement."

**Output:** "Assess customer satisfaction and identify product improvement areas."

**Input:** "Research summary on the latest industry trends and their potential impact on our business strategy."

**Output:** "Analyze industry trends and their impact on business strategy."

**Input:** "Training session notes covering new software tool functionalities and best practices for team usage."

**Output:** "Outline new software tool functionalities and best practices for team usage."

# Notes

- Ensure that the generated intent is specific, clear, and directly related to the content of the note.
- Avoid vague or overly broad intents; focus on the key purpose of the note.`,
		prompt: `Title: ${thoughtRecord.title}
\`\`\`
${thoughtRecord.content_md}
\`\`\``,
		headers: {
			"Helicone-Session-Name": "Thought-intent",
		},
		schema: z.object({
			thoughts: z.array(z.string()),
			intent: z.string(),
		}),
		temperature: 0,
	});

	if (intent.endsWith(".")) {
		intent = intent.slice(0, -1);
	}

	return intent;
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

const makeEmbeddingInput = (intent: string, summary: string) => {
	return `${intent}; ${summary}`;
};

const makeRerankerInput = (intent: string, summary: string, contentMd: string) => {
	return `${intent}; ${summary}; ${contentMd}`;
};

export const generateIntentSummaryAndEmbedding = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	let intent, summary;
	if (thoughtRecord.generated_intent && thoughtRecord.generated_summary) {
		intent = thoughtRecord.generated_intent;
		summary = thoughtRecord.generated_summary;
	} else {
		if (!thoughtRecord.content_md || thoughtRecord.content_md.length < 36) {
			throw new Error("Content too short");
		}

		[intent, summary] = await Promise.all([generateIntent(thoughtRecord), generateSummary(thoughtRecord)]);
	}

	const embeddingInput = makeEmbeddingInput(intent, summary);
	const embeddings = await generateEmbeddings([embeddingInput], "text-embedding-3-large");

	if (!embeddings) {
		throw new Error("No embeddings");
	}

	handleSupabaseError(
		await supabase
			.from("thoughts")
			.update({ generated_summary: summary, generated_intent: intent, embeddings_version: 2 })
			.eq("id", thoughtRecord.id),
	);
	handleSupabaseError(await supabase.from("thought_summary_embeddings").delete().eq("thought_id", thoughtRecord.id));
	handleSupabaseError(
		await supabase.from("thought_summary_embeddings").insert({
			thought_id: thoughtRecord.id,
			embedding: JSON.stringify(embeddings[0]),
		}),
	);

	return { embedding: embeddings[0], intent, summary };
};

export const mapRelationshipsForThought = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	const { generated_intent: intent, generated_summary: summary, content_md: contentMd } = thoughtRecord;
	if (!intent || !summary || !contentMd) {
		throw new Error("No intent, summary, or content_md");
	}

	const { embedding } = handleSupabaseError(
		await supabase.from("thought_summary_embeddings").select("embedding").eq("thought_id", thoughtRecord.id).single(),
	);

	const similarThoughts = handleSupabaseError(
		await supabase.rpc("embedding_thought_summary_search", {
			query_embedding: embedding,
			match_threshold: 0.35,
			max_results: 36,
			p_workspace_id: thoughtRecord.workspace_id!,
			ignore_thought_ids: [thoughtRecord.id],
		}),
	);

	if (similarThoughts.length === 0) {
		handleSupabaseError(await supabase.from("thought_relations").delete().eq("matched_by", thoughtRecord.id));
		handleSupabaseError(await supabase.from("thought_relations").delete().eq("matches", thoughtRecord.id));
		return;
	}

	const thoughts = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("id,title,content_md,generated_intent,generated_summary,collection_thoughts(collections(id)), workspace_id")
			.in(
				"id",
				similarThoughts.map(t => t.thought_id),
			),
	);

	const filteredThoughts = thoughts.filter(
		t => t.id !== thoughtRecord.id && t.generated_intent && t.generated_summary && t.content_md,
	);

	const rerankedSimilarThoughts = await jinaRerankingWithExponentialBackoff(
		makeRerankerInput(intent, summary, contentMd.slice(0, 4096)),
		filteredThoughts.map(t => makeRerankerInput(t.generated_intent!, t.generated_summary!, t.content_md!.slice(0, 4096))),
		36,
	);

	const filteredThoughtsWithScore = rerankedSimilarThoughts
		.map(t => ({
			...filteredThoughts[t.index]!,
			similarity_score: t.relevance_score,
		}))
		.filter(t => t.similarity_score > 0.15)
		.sort((a, b) => b.similarity_score - a.similarity_score);

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
	const meanCollectionScores = Array.from(collectionScores.entries()).map(([collectionId, scores]) => ({
		collectionId,
		meanScore: scores.reduce((a, b) => a + b, 0) / scores.length,
	}));

	const collectionIdsToSuggest = meanCollectionScores
		.filter(score => score.meanScore > 0.2)
		.sort((a, b) => b.meanScore - a.meanScore)
		.map(score => score.collectionId);

	handleSupabaseError(
		await supabase.from("thoughts").update({ collection_suggestions: collectionIdsToSuggest }).eq("id", thoughtRecord.id),
	);
};

export const intentSummaryEmbeddingPipeline = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	if (!thoughtRecord.content_md) {
		return;
	}

	await addSignal(ThoughtSignals.EMBEDDING_UPDATE, thoughtRecord.id, supabase);

	try {
		await generateIntentSummaryAndEmbedding(thoughtRecord, supabase);

		const newThoughtRecord = handleSupabaseError(
			await supabase.from("thoughts").select("*").eq("id", thoughtRecord.id).single(),
		);
		await mapRelationshipsForThought(newThoughtRecord, supabase);
	} finally {
		await removeSignal(ThoughtSignals.EMBEDDING_UPDATE, thoughtRecord.id, supabase);
	}
};
