import { RepoReference, ThreadRespondPostRequestBody, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { makeHeliconeHeaders } from "app/api/utils/helicone";
import { getFileContentsPrompt } from "app/api/utils/repoContext";
import { getSupabase } from "app/api/utils/supabase";
import { getContextForThought } from "app/api/utils/thoughts";

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as ThreadRespondPostRequestBody;

	return respond(payload, supabase);
};

const makeSelectionRespondPrompts = ({
	filesPrompt,
	contextText,
	content,
	hasSelection,
	title,
}: {
	filesPrompt?: string;
	contextText: string;
	content: string;
	hasSelection?: boolean;
	title?: string | null;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing ideation tool that helps users write technical documents.

${
	filesPrompt
		? `Below are the contents of the files referenced in the note, use this as context:
${filesPrompt}`
		: ""
}

${contextText}
The user is in the process of writing the below note${
			hasSelection
				? `  and has also selected a specific part of the text to talk to you about, the selection is marked with the [[[ and ]]] tags, for example, in the following text: "Hi [[[user]]] I'm doing well", the selection is "user".`
				: ""
		}
You are able to suggest edits to the note as needed, to suggest an edit, you MUST wrap your suggestion in a <suggestion></suggestion> tag, and provide the original content and your new suggestion, for example:

# EXAMPLE SUGGESTION:
<suggestion>
<original_content>
- Wow this is a great idea!
- We can expand it further
</original_content>
<replacement_content>
Wow this is not a bad idea. We can expand it further.
</replacement_content>
</suggestion>

If the user asks you to make a change, you MUST wrap the original content and your new suggestion in a <suggestion></suggestion> tag.
If the user asks you to write something, you MUST wrap your suggestion in a <suggestion></suggestion> tag, following the same format as above.

Below is the note the user is writing${hasSelection ? `, and the selection they have made:` : ":"}
${title ? `Title: ${title}` : ""}
${content}`,
	},
];

interface Comment {
	content: string;
	id: string;
	isOriginal: boolean;
	role: "user" | "assistant";
}

const respond = async (payload: ThreadRespondPostRequestBody, supabase: SupabaseClient<Database>) => {
	const {
		title,
		content_md: contentMd,
		workspace_id: workspaceId,
	} = handleSupabaseError(
		await supabase.from("thoughts").select("title, content_md, workspace_id").eq("id", payload.thoughtId).single(),
	);

	if (!contentMd) {
		throw new Error("Content not found");
	}

	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const heliconeHeaders = makeHeliconeHeaders({
		userId,
		sessionName: "Respond to Thread",
		sessionId: `respond-to-thread/${randomUUID()}`,
	});

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

	const hasSelection = (comment.related_chunks && comment.related_chunks.length > 0) ?? false;

	let contentToSend = contentMd;

	if (hasSelection) {
		const selectionStart = contentMd.indexOf(comment.related_chunks![0]!);
		const selectionEnd = selectionStart + comment.related_chunks![0]!.length;

		contentToSend =
			contentMd.slice(0, selectionStart) + `[[[${comment.related_chunks![0]!}]]]` + contentMd.slice(selectionEnd);
	}

	const filesPrompt = await getFileContentsPrompt(payload.thoughtId, supabase);

	const contextText = await getContextForThought(payload.thoughtId, workspaceId, supabase, {
		...heliconeHeaders,
		"Helicone-Session-Path": "respond-to-selection/context",
	});

	const messages = makeSelectionRespondPrompts({ filesPrompt, contextText, content: contentToSend, hasSelection, title });
	threadCommentHistory.forEach(comment => {
		messages.push({
			role: comment.role,
			content: comment.content,
		});
	});

	const stream = await streamText({
		model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
		// model: heliconeOpenAI.languageModel("gpt-4o-mini"),
		messages,
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "respond-to-selection",
		},
	});

	handleSupabaseError(
		await supabase
			.from("thought_chats")
			.update({
				is_thread_loading: false,
			})
			.eq("id", comment.id),
	);

	return stream.toTextStreamResponse();

	// let fullText = "";
	// const threadReplyId = randomUUID();
	// for await (const textPart of textStream) {
	// 	fullText += textPart;
	// 	handleSupabaseError(
	// 		await supabase.from("thought_chat_threads").upsert({
	// 			id: threadReplyId,
	// 			comment_id: payload.commentId,
	// 			content: fullText,
	// 			role: "assistant",
	// 			status: "pending",
	// 		}),
	// 	);
	// }

	// handleSupabaseError(
	// 	await supabase
	// 		.from("thought_chat_threads")
	// 		.update({
	// 			status: "success",
	// 		})
	// 		.eq("id", threadReplyId),
	// );

	// return NextResponse.json({
	// 	success: true,
	// });
};
