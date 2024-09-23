import { TopicRecord, handleSupabaseError, makeHumanizedTime } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { heliconeOpenAI } from "app/api/utils/helicone";

import { generateJinaQueryEmbedding } from "../utils/embeddings";

export const updateTopic = async (
	query: string,
	workspaceId: string,
	supabase: SupabaseClient<Database>,
	existingTopicId?: string,
) => {
	// Generate query embeddings
	const queryEmbeddings = await generateJinaQueryEmbedding(query);

	if (!queryEmbeddings) {
		return NextResponse.json({ error: "Failed to generate query embeddings" }, { status: 500 });
	}

	// Perform embedding search
	const results = handleSupabaseError(
		await supabase.rpc("multi_embedding_thought_chunk_search", {
			query_embeddings: queryEmbeddings.map(embedding => JSON.stringify(embedding)),
			match_threshold: 0.8,
			max_results: 10,
			workspace_id: workspaceId,
		}),
	);

	let summary: string | null = null;
	let latestUpdate: string | null = null;
	if (results.length > 0) {
		const chunkContents = handleSupabaseError(
			await supabase
				.from("thought_chunks")
				.select("content, thought:thoughts(created_at)")
				.in(
					"id",
					results.map(result => result.chunk_id),
				),
		);
		chunkContents.sort((a, b) => new Date(a.thought!.created_at).getTime() - new Date(b.thought!.created_at).getTime());

		const { object: querySummaries } = await generateObject({
			model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
			prompt: `Given the following topic query: "${query}", the following results returned from the search, sorted by time:
	---\n${chunkContents.map(content => `Result:\nDate: ${makeHumanizedTime(content.thought!.created_at)}\n${content.content}`).join("\n---\n")}\n---
	
	Explain in a concise manner how the topic evolved over time.`,
			schema: z.object({
				detailedSummaries: z
					.array(
						z.object({
							summaryReasoning: z.string(),
							summary: z.string(),
						}),
					)
					.describe("Concise summary of how the topic evolved over time, with reasoning for each result."),
				executiveSummary: z.string().describe("An executive summary of the topic."),
				latestUpdate: z.string().describe("An executive summary of the latest update in the topic."),
			}),
		});

		summary = querySummaries.executiveSummary;
		latestUpdate = querySummaries.latestUpdate;

		console.log("querySummaries", querySummaries);
	}

	let topic: TopicRecord | null = null;
	if (existingTopicId) {
		topic = handleSupabaseError(
			await supabase
				.from("topics")
				.update({
					workspace_id: workspaceId,
					query,
					summary,
					latest_update: latestUpdate,
				})
				.eq("id", existingTopicId)
				.select()
				.single(),
		);
	} else {
		topic = handleSupabaseError(
			await supabase
				.from("topics")
				.insert({
					workspace_id: workspaceId,
					query,
					summary,
					latest_update: latestUpdate,
				})
				.select()
				.single(),
		);
	}

	if (!topic) {
		throw new Error("Failed to create topic");
	}

	// Delete any existing topic message matches
	handleSupabaseError(await supabase.from("topic_thought_chunk_matches").delete().eq("topic_id", topic.id));

	const chunkIds = Array.from(new Set(results.map(result => result.chunk_id)));
	handleSupabaseError(
		await supabase.from("topic_thought_chunk_matches").insert(
			chunkIds.map(chunkId => ({
				topic_id: topic.id,
				chunk_id: chunkId,
			})),
		),
	);
};
