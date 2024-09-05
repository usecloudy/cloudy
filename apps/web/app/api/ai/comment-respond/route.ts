import { openai } from "@ai-sdk/openai";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import { getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";
import { makeSuggestEditTool } from "app/api/utils/tools";

import { makeCommentRespondPrompts } from "./prompts";

interface Comment {
	content: string;
	id: string;
	isOriginal: boolean;
	role: "user" | "assistant";
}

export const maxDuration = 60;

interface RequestBody {
	threadId: string;
}

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { threadId } = (await req.json()) as RequestBody;

	return respondToComment(threadId, supabase);
};

export const respondToComment = async (threadId: string, supabase: SupabaseClient<Database>) => {
	console.log("threadId", threadId);
	const { data: existingThread } = await supabase
		.from("thought_chat_threads")
		.select("*")
		.eq("comment_id", threadId)
		.order("created_at", { ascending: true });
	const { data: originalComment } = await supabase.from("thought_chats").select("*, thoughts(*)").eq("id", threadId).single();

	if (!originalComment) {
		throw new Error("Missing original comment");
	}

	const thought = originalComment.thoughts;

	if (!thought) {
		throw new Error("Missing thought");
	}

	await supabase
		.from("thought_chats")
		.update({
			is_thread_loading: true,
		})
		.eq("id", originalComment.id);

	let threadCommentHistory: Comment[] =
		existingThread?.map(c => ({
			content: c.content,
			id: c.id,
			isOriginal: false,
			role: c.role as "assistant" | "user",
		})) ?? [];

	threadCommentHistory = [
		{
			content: originalComment.content!,
			id: originalComment.id,
			isOriginal: true,
			role: originalComment.role === "user" ? "user" : "assistant",
		},
		...threadCommentHistory,
	];

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
		experimental_telemetry: {
			isEnabled: true,
		},
	});

	await supabase.from("thought_chat_threads").insert({
		comment_id: originalComment.id,
		content: commentText,
		suggestion: suggestionContent,
		role: "assistant",
	});

	await supabase
		.from("thought_chats")
		.update({
			is_thread_loading: false,
		})
		.eq("id", originalComment.id);

	return new Response(
		JSON.stringify({
			success: true,
		}),
		{ headers: { "Content-Type": "application/json" } },
	);
};
