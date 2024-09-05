import { openai } from "@ai-sdk/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { chunkAndHashMarkdown, getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { addSignal, removeSignal } from "app/api/utils/thoughts";
import { Database } from "app/db/database.types";

import { ThoughtRecord } from "../utils";
import { makeTitleSuggestionPrompts } from "./prompts";

const TitleSuggestionSchema = z.object({
	title: z.string(),
	is_new: z.boolean(),
});

export const suggestTitle = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	console.log("Will suggest a title for thought", thoughtRecord.id);

	if (thoughtRecord.title && thoughtRecord.title.length > 2) {
		return NextResponse.json({ success: false, reason: "title_already_exists" });
	}

	const { data: existingTitleSuggestion } = await supabase
		.from("thought_chats")
		.select("id")
		.eq("thought_id", thoughtRecord.id)
		.eq("type", "title_suggestion")
		.maybeSingle();

	if (existingTitleSuggestion) {
		return NextResponse.json({ success: false, reason: "title_suggestion_already_exists" });
	}

	const contentMd = thoughtRecord.content_md;

	if (!contentMd) {
		throw new Error(`Thought ${thoughtRecord.id} has no content_md`);
	}

	if (contentMd.length < 64) {
		return NextResponse.json({ success: false, reason: "content_md_too_short" });
	}

	try {
		// Mark as processing
		await supabase.from("thoughts").update({ suggestion_status: "processing" }).eq("id", thoughtRecord.id);

		await addSignal("suggest-title", thoughtRecord.id, supabase);

		// Get all current chunks for the thought
		const relatedChunks = await getRelatedChunkContentsForThought(thoughtRecord.id, supabase);

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
				thought_id: thoughtRecord.id,
				type: "title_suggestion",
				role: "assistant",
				content: title,
			});
		}
	} finally {
		await removeSignal("suggest-title", thoughtRecord.id, supabase);
	}

	return;
};
