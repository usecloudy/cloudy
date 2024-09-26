import { SelectionRespondPostRequestBody, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";
import { getContextForThought } from "app/api/utils/thoughts";

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as SelectionRespondPostRequestBody;

	return respond(payload, supabase);
};

const makeSelectionRespondPrompts = ({
	contextText,
	contentWithSelection,
	title,
}: {
	contextText: string;
	contentWithSelection: string;
	title?: string | null;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing ideation tool that helps users think through problems and ideas, asks the right questions, and makes actionable suggestions.

You must answer in a friendly, helpful, and short & concise manner.

${contextText}
The user is in the process of writing the below note and has also selected a specific part of the text to talk to you about, the selection is marked with the [[[ and ]]] tags, for example, in the following text: "Hi [[[user]]] I'm doing well", the selection is "user".
You are able to suggest edits to the note as needed, to suggest an edit, you MUST wrap your suggestion in \`\`\` backticks, for example:
\`\`\`
This is the edit I want to make
\`\`\`

Below is the note the user is writing, and the selection they have made:
${title ? `Title: ${title}` : ""}
${contentWithSelection}`,
	},
];

interface Comment {
	content: string;
	id: string;
	isOriginal: boolean;
	role: "user" | "assistant";
}

const respond = async (payload: SelectionRespondPostRequestBody, supabase: SupabaseClient<Database>) => {
	const { title, content_md: contentMd } = handleSupabaseError(
		await supabase.from("thoughts").select("title, content_md").eq("id", payload.thoughtId).single(),
	);

	if (!contentMd) {
		throw new Error("Content not found");
	}

	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const heliconeHeaders = {
		"Helicone-User-Id": userId,
		"Helicone-Session-Name": "Respond to Selection",
		"Helicone-Session-Id": `respond-to-selection/${randomUUID()}`,
	};

	const comment = handleSupabaseError(await supabase.from("thought_chats").select("*").eq("id", payload.commentId).single());
	const existingThread = handleSupabaseError(
		await supabase
			.from("thought_chat_threads")
			.select("*")
			.eq("comment_id", comment.id)
			.order("created_at", { ascending: true }),
	);

	let threadCommentHistory: Comment[] =
		existingThread?.map(c => ({
			content: c.content,
			id: c.id,
			isOriginal: false,
			role: c.role as "assistant" | "user",
		})) ?? [];

	threadCommentHistory = [
		{
			content: comment.content!,
			id: comment.id,
			isOriginal: true,
			role: comment.role === "user" ? "user" : "assistant",
		},
		...threadCommentHistory,
	];

	const selectionStart = contentMd.indexOf(comment.related_chunks![0]!);
	const selectionEnd = selectionStart + comment.related_chunks![0]!.length;

	const contentWithSelection =
		contentMd.slice(0, selectionStart) + `[[[${comment.related_chunks![0]!}]]]` + contentMd.slice(selectionEnd);

	const contextText = await getContextForThought(payload.thoughtId, supabase, {
		...heliconeHeaders,
		"Helicone-Session-Path": "respond-to-selection/context",
	});

	const messages = makeSelectionRespondPrompts({ contextText, contentWithSelection, title });
	threadCommentHistory.forEach(comment => {
		messages.push({
			role: comment.role,
			content: comment.content,
		});
	});

	const { textStream } = await streamText({
		model: heliconeOpenAI.languageModel("gpt-4o-mini"),
		messages,
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "edit-selection",
		},
	});

	let fullText = "";
	const threadReplyId = randomUUID();
	for await (const textPart of textStream) {
		fullText += textPart;
		await supabase.from("thought_chat_threads").upsert({
			id: threadReplyId,
			comment_id: payload.commentId,
			content: fullText,
			role: "assistant",
			status: "pending",
		});
	}

	await supabase
		.from("thought_chat_threads")
		.update({
			status: "success",
		})
		.eq("id", threadReplyId);

	// Extract each ``` edit blocks
	// send them to the apply tool

	return NextResponse.json({
		success: true,
	});
};
