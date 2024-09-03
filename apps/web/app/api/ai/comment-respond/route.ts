import { openai } from "@ai-sdk/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";
import { makeSuggestEditTool } from "app/api/utils/tools";
import { Database } from "app/db/database.types";

import { makeCommentRespondPrompts } from "./prompts";

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
	old_record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

interface Comment {
	content: string;
	id: string;
	isOriginal: boolean;
	role: "user" | "assistant";
}

export const maxDuration = 60;

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	return respondToComment(payload, supabase);
};

const respondToComment = async (payload: Payload, supabase: SupabaseClient<Database>) => {
	if (payload.type !== "INSERT") {
		throw new Error("Need to be an insert");
	}

	if (payload.record.role !== "user") {
		return NextResponse.json({
			success: true,
		});
	}

	const { data: existingThread } = await supabase
		.from("thought_chat_threads")
		.select("*")
		.eq("comment_id", payload.record.comment_id);
	const { data: originalSuggestion } = await supabase
		.from("thought_chats")
		.select("*, thoughts(*)")
		.eq("id", payload.record.comment_id)
		.single();

	if (!originalSuggestion) {
		throw new Error("Missing original comment");
	}

	const thought = originalSuggestion.thoughts;

	if (!thought) {
		throw new Error("Missing thought");
	}

	await supabase
		.from("thought_chats")
		.update({
			is_thread_loading: true,
		})
		.eq("id", originalSuggestion.id);

	let threadCommentHistory: Comment[] =
		existingThread?.map(c => ({
			content: c.content,
			id: c.id,
			isOriginal: false,
			role: c.role as "assistant" | "user",
		})) ?? [];

	threadCommentHistory = [
		{
			content: originalSuggestion.content!,
			id: originalSuggestion.id,
			isOriginal: true,
			role: "assistant",
		},
		...threadCommentHistory,
	];

	if (!threadCommentHistory.some(c => c.id === payload.record.id)) {
		threadCommentHistory.push({
			content: payload.record.content,
			id: payload.record.id,
			isOriginal: false,
			role: "user",
		});
	}

	const relatedChunks = await getRelatedChunkContentsForThought(thought.id, supabase);

	const messages = makeCommentRespondPrompts({
		relatedChunks,
		thought: {
			title: thought.title,
			contentMd: thought.content_md!,
		},
	});

	threadCommentHistory.forEach(comment => {
		messages.push({
			role: comment.role,
			content: comment.content,
		});
	});

	let suggestionContent: string | null = null;

	console.log("messages", messages);

	const { text: commentText } = await generateText({
		model: openai.languageModel("gpt-4o-2024-08-06"),
		temperature: 0.5,
		messages,
		maxTokens: 1024,
		tools: {
			suggestEdit: makeSuggestEditTool(thought.content!, newContent => {
				suggestionContent = newContent;
			}),
		},
		maxToolRoundtrips: 3,
	});

	await supabase.from("thought_chat_threads").insert({
		comment_id: originalSuggestion.id,
		content: commentText,
		suggestion: suggestionContent,
		role: "assistant",
	});

	await supabase
		.from("thought_chats")
		.update({
			is_thread_loading: false,
		})
		.eq("id", originalSuggestion.id);

	return new Response(
		JSON.stringify({
			success: true,
		}),
		{ headers: { "Content-Type": "application/json" } },
	);
};
