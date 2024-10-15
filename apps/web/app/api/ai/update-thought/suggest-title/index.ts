import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject } from "ai";
import { randomUUID } from "crypto";
import { distance } from "fastest-levenshtein";
import { NextResponse } from "next/server";
import { z } from "zod";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { addSignal, getContextForThought, removeSignal } from "app/api/utils/thoughts";

import { ThoughtRecord } from "../utils";
import { makeTitleSuggestionPrompts } from "./prompts";

const TitleSuggestionSchema = z.object({
	title: z.string(),
	is_new: z.boolean(),
});

export const suggestTitle = async (thoughtRecord: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	console.log("Will suggest a title for thought", thoughtRecord.id);

	if (thoughtRecord.disable_title_suggestions) {
		return NextResponse.json({ success: false, reason: "title_suggestions_disabled" });
	}

	if (thoughtRecord.title) {
		return NextResponse.json({ success: false, reason: "title_already_exists" });
	}

	const contentMd = thoughtRecord.content_md;

	if (!contentMd) {
		throw new Error(`Thought ${thoughtRecord.id} has no content_md`);
	}

	if (contentMd.length < 64) {
		return NextResponse.json({ success: false, reason: "content_md_too_short" });
	}

	if (thoughtRecord.title_suggestion_content_md) {
		const editDistance = distance(contentMd, thoughtRecord.title_suggestion_content_md);

		if (editDistance < 128) {
			return NextResponse.json({ success: false, reason: "title_suggestion_too_similar" });
		}
	}

	try {
		// Mark as processing
		await supabase.from("thoughts").update({ suggestion_status: "processing" }).eq("id", thoughtRecord.id);

		await addSignal("suggest-title", thoughtRecord.id, supabase);

		const heliconeSessionId = randomUUID();
		const heliconeHeaders = {
			"Helicone-User-Id": thoughtRecord.author_id,
			"Helicone-Session-Name": "Suggest Title",
			"Helicone-Session-Id": `thought-suggest-title/${heliconeSessionId}`,
		};

		const messages = makeTitleSuggestionPrompts({
			contextText: await getContextForThought(thoughtRecord.id, thoughtRecord.workspace_id, supabase, {
				...heliconeHeaders,
				"Helicone-Session-Path": "thought-suggest-title/context",
			}),
			currentContentMd: contentMd,
		});

		console.log("Messages:", messages);

		const { object: titleSuggestion } = await generateObject({
			model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
			messages,
			schema: TitleSuggestionSchema,
			schemaName: "title_suggestion",
			temperature: 0.5,
			maxTokens: 256,
			headers: {
				...heliconeHeaders,
				"Helicone-Session-Path": "thought-suggest-title",
			},
		});

		if (titleSuggestion) {
			const title = titleSuggestion.title;

			await supabase
				.from("thoughts")
				.update({ title_suggestion: title, title_suggestion_content_md: contentMd })
				.eq("id", thoughtRecord.id);
		}
	} finally {
		await removeSignal("suggest-title", thoughtRecord.id, supabase);
	}

	return;
};
