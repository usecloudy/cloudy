import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { getContextForThought } from "app/api/utils/thoughts";
import { makeSuggestEditTool } from "app/api/utils/tools";

import { makeCommentRespondPrompts } from "./prompts";

interface Comment {
	content: string;
	id: string;
	isOriginal: boolean;
	role: "user" | "assistant";
}

export const respondToComment = async (threadId: string, supabase: SupabaseClient<Database>) => {
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

	const sharedHeliconeHeaders = {
		"Helicone-Property-ThreadId": threadId,
		"Helicone-User-Id": thought.author_id,
		"Helicone-Session-Name": "Thread",
		"Helicone-Session-Path": "thought-thread-respond",
		"Helicone-Session-Id": `thought-threads/${threadId}`,
	};

	const messages = makeCommentRespondPrompts({
		contextText: await getContextForThought(thought.id, supabase, {
			...sharedHeliconeHeaders,
			"Helicone-Session-Path": "thought-thread-respond/context-condense",
		}),
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

	const { tool: suggestEditTool, edits, applyEdits } = makeSuggestEditTool(thought.content!, sharedHeliconeHeaders);

	const { text: commentText } = await generateText({
		model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
		temperature: 0.5,
		messages,
		maxTokens: 4096,
		tools: {
			suggestEdit: suggestEditTool,
		},
		maxToolRoundtrips: 3,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: sharedHeliconeHeaders,
	});

	const hasEdits = edits.length > 0;

	const newComment = handleSupabaseError(
		await supabase
			.from("thought_chat_threads")
			.insert({
				comment_id: originalComment.id,
				content: commentText,
				role: "assistant",
				is_loading_suggestion: hasEdits,
			})
			.select()
			.single(),
	);

	await supabase
		.from("thought_chats")
		.update({
			is_thread_loading: false,
		})
		.eq("id", originalComment.id);

	if (hasEdits) {
		const editContent = await applyEdits();

		handleSupabaseError(
			await supabase
				.from("thought_chat_threads")
				.update({
					suggestion: editContent,
					is_loading_suggestion: false,
				})
				.eq("id", newComment.id),
		);
	}

	return new Response(
		JSON.stringify({
			success: true,
		}),
		{ headers: { "Content-Type": "application/json" } },
	);
};
