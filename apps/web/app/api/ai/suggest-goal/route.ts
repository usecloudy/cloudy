import { openai } from "@ai-sdk/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { chunkAndHashMarkdown, getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";
import { addSignal, checkForSignal, removeSignal } from "app/api/utils/thoughts";
import { Database } from "app/db/database.types";

import { makeGoalSuggestionPrompts } from "./prompts";

type Payload = {
	thoughtId: string;
};

const GoalSuggestionSchema = z.object({
	goal: z.string(),
});

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return suggestGoal(payload.thoughtId, supabase);
};

const suggestGoal = async (thoughtId: string, supabase: SupabaseClient) => {
	if (await checkForSignal("suggest-goal", thoughtId, supabase)) {
		return NextResponse.json({ success: false, reason: "goal_suggestion_already_running" });
	}
	console.log("Will suggest a goal for thought", thoughtId);

	const { data, error } = await supabase.from("thoughts").select("id, content_md").eq("id", thoughtId).single();

	if (error) {
		throw error;
	}

	const contentMd = data.content_md;

	if (!contentMd) {
		throw new Error(`Thought ${thoughtId} has no content_md`);
	}

	if (contentMd.length < 64) {
		return NextResponse.json({ success: false, reason: "content_md_too_short" });
	}

	try {
		// Mark as processing
		await supabase.from("thoughts").update({ suggestion_status: "processing" }).eq("id", thoughtId);

		await addSignal("suggest-goal", thoughtId, supabase);

		// Get all current chunks for the thought
		const relatedChunks = await getRelatedChunkContentsForThought(thoughtId, supabase);

		console.log(`Found ${relatedChunks.length} related chunks`);

		console.log("Will chunk markdown...");
		const chunks = await chunkAndHashMarkdown(contentMd);
		console.log(`Generated ${chunks.length} chunks`);

		const messages = makeGoalSuggestionPrompts({
			relatedChunks,
			currentContentMd: contentMd,
		});

		console.log("Messages:", messages);

		const { object: goalSuggestion } = await generateObject({
			model: openai.languageModel("gpt-4o-mini-2024-07-18"),
			messages,
			schema: GoalSuggestionSchema,
			schemaName: "goal_suggestion",
			temperature: 0.5,
			maxTokens: 256,
		});

		if (goalSuggestion) {
			const goal = goalSuggestion.goal;

			await supabase
				.from("thoughts")
				.update({
					suggested_goal: goal,
				})
				.eq("id", thoughtId);
		}

		// Mark as idle
		await supabase
			.from("thoughts")
			.update({
				suggestion_status: "idle",
			})
			.eq("id", thoughtId);
	} finally {
		await removeSignal("suggest-goal", thoughtId, supabase);
	}

	return NextResponse.json({ success: true });
};
