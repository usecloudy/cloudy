import { openai } from "@ai-sdk/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { chunkAndHashMarkdown, getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";
import { addSignal, checkForSignal, removeSignal } from "app/api/utils/thoughts";
import { Database } from "app/db/database.types";

import { makeTitleSuggestionPrompts } from "./prompts";

type Payload = {
	thoughtId: string;
};

const TitleSuggestionSchema = z.object({
	title: z.string(),
	is_new: z.boolean(),
});

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return suggestTitle(payload.thoughtId, supabase);
};

const suggestTitle = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	if (await checkForSignal("suggest-title", thoughtId, supabase)) {
		return NextResponse.json({ success: false, reason: "title_suggestion_already_running" });
	}
	console.log("Will suggest a title for thought", thoughtId);

	const { data, error } = await supabase.from("thoughts").select("id, title, content_md").eq("id", thoughtId).single();

	if (error) {
		throw error;
	}

	if (data.title && data.title.length > 2) {
		return NextResponse.json({ success: false, reason: "title_already_exists" });
	}

	const { data: existingTitleSuggestion } = await supabase
		.from("thought_chats")
		.select("id")
		.eq("thought_id", thoughtId)
		.eq("type", "title_suggestion")
		.maybeSingle();

	if (existingTitleSuggestion) {
		return NextResponse.json({ success: false, reason: "title_suggestion_already_exists" });
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

		await addSignal("suggest-title", thoughtId, supabase);

		// Get all current chunks for the thought
		const relatedChunks = await getRelatedChunkContentsForThought(thoughtId, supabase);

		console.log(`Found ${relatedChunks.length} related chunks`);

		console.log("Will chunk markdown...");
		const chunks = await chunkAndHashMarkdown(contentMd);
		console.log(`Generated ${chunks.length} chunks`);

		const messages = makeTitleSuggestionPrompts({
			relatedChunks,
			currentContentMd: contentMd,
		});

		console.log("Messages:", messages);

		const { object: titleSuggestion } = await generateObject({
			model: openai.languageModel("gpt-4o-mini-2024-07-18"),
			messages,
			schema: TitleSuggestionSchema,
			schemaName: "title_suggestion",
			temperature: 0.5,
			maxTokens: 256,
		});

		if (titleSuggestion) {
			const title = titleSuggestion.title;

			await supabase.from("thought_chats").insert({
				thought_id: thoughtId,
				type: "title_suggestion",
				role: "assistant",
				content: title,
			});
		}

		// Mark as idle
		await supabase
			.from("thoughts")
			.update({
				suggestion_status: "idle",
			})
			.eq("id", thoughtId);
	} finally {
		await removeSignal("suggest-title", thoughtId, supabase);
	}

	return NextResponse.json({ success: true });
};
