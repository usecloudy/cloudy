import { anthropic } from "@ai-sdk/anthropic";
import { ChatMessageRecord, ThreadRespondPostRequestBody, fixOneToOne, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { heliconeAnthropic, heliconeOpenAI } from "app/api/utils/helicone";
import { makeHeliconeHeaders } from "app/api/utils/helicone";
import { getFileContentsPrompt } from "app/api/utils/repoContext";
import { getSupabase } from "app/api/utils/supabase";
import { getContextForThought } from "app/api/utils/thoughts";

export const POST = async (req: NextRequest) => {
	const supabase = await getSupabase({ request: req, mode: "client" });

	const payload = (await req.json()) as ThreadRespondPostRequestBody;

	return respond(payload, supabase);
};

const makeSelectionRespondPrompts = ({
	filesText,
	contextText,
	documentContent,
	hasSelection,
	documentTitle,
}: {
	filesText?: string;
	contextText?: string;
	documentContent?: string | null;
	hasSelection?: boolean;
	documentTitle?: string | null;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing ideation tool that helps users write technical documents.

${
	filesText
		? `Below are the contents of the files referenced in the document, use this as context:
${filesText}`
		: ""
}

${contextText}
The user is in the process of writing the below document${
			hasSelection
				? `  and has also selected a specific part of the text to talk to you about, the selection is marked with the [[[ and ]]] tags, for example, in the following text: "Hi [[[user]]] I'm doing well", the selection is "user".`
				: ""
		}
You are able to suggest edits to the document as needed, to suggest an edit, you MUST wrap your suggestion in a <suggestion></suggestion> tag, and provide the original content and your new suggestion, for example:

# EXAMPLES:

## Example 1:
<suggestion>
<original_content>
- Wow this is a great idea!
- We can expand it further
</original_content>
<replacement_content>
Wow this is not a bad idea. We can expand it further.
</replacement_content>
</suggestion>

## Example 2:
<suggestion>
<original_content>
- Wow this is a great idea!
- We can expand it further
</original_content>
<replacement_content></replacement_content> # Deletes the lines
</suggestion>

If the user asks you to make a change, you MUST wrap the original content and your new suggestion in a <suggestion></suggestion> tag.
If the user asks you to write something, you MUST wrap your suggestion in a <suggestion></suggestion> tag, following the same format as above.
When making large edits, prefer to use multiple <suggestion></suggestion> tags, rather than one large suggestion.

Below is the document the user is writing${hasSelection ? `, and the selection they have made:` : ":"}
<document${documentTitle ? ` title="${documentTitle}"` : ""}>
${documentContent}
</document>`,
		experimental_providerMetadata: {
			anthropic: { cacheControl: { type: "ephemeral" } },
		},
	},
];

const makeMessageWithSelection = (message: ChatMessageRecord): CoreMessage => {
	return {
		role: message.role as "user" | "assistant",
		content:
			(message.selection_text ? `\`\`\`user selected the text:"${message.selection_text}"\`\`\`\n\n` : "") +
			message.content,
	};
};

const respond = async (payload: ThreadRespondPostRequestBody, supabase: SupabaseClient<Database>) => {
	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const heliconeHeaders = makeHeliconeHeaders({
		userId,
		sessionName: "Respond to Thread",
		sessionId: `respond-to-thread/${randomUUID()}`,
	});

	const chatThread = handleSupabaseError(
		await supabase
			.from("chat_threads")
			.select("*, workspace_id, document:thoughts!document_id(id, title, content_md), messages:chat_messages(*)")
			.eq("id", payload.threadId)
			.single(),
	);

	const document = fixOneToOne(chatThread.document);

	const threadMessages = chatThread.messages
		.filter(m => m.id !== payload.messageId)
		.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

	// const hasSelection = (comment.related_chunks && comment.related_chunks.length > 0) ?? false;

	// if (hasSelection) {
	// 	const selectionStart = contentMd.indexOf(comment.related_chunks![0]!);
	// 	const selectionEnd = selectionStart + comment.related_chunks![0]!.length;

	// 	contentToSend =
	// 		contentMd.slice(0, selectionStart) + `[[[${comment.related_chunks![0]!}]]]` + contentMd.slice(selectionEnd);
	// }
	const hasSelection = false;

	let filesText: string | undefined;
	let contextText: string | undefined;
	if (document) {
		filesText = await getFileContentsPrompt(document.id, supabase);

		contextText = await getContextForThought(document.id, chatThread.workspace_id, supabase, {
			...heliconeHeaders,
			"Helicone-Session-Path": "respond-to-selection/context",
		});
	}

	const llmMessages = makeSelectionRespondPrompts({
		filesText,
		contextText,
		documentContent: document?.content_md,
		hasSelection,
		documentTitle: document?.title,
	});

	threadMessages.forEach(message => {
		llmMessages.push(makeMessageWithSelection(message));
	});

	if (threadMessages.at(-1)?.role !== "user") {
		throw new Error("Last message is not a user message");
	}

	const stream = await streamText({
		// model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
		// model: heliconeOpenAI.languageModel("gpt-4o-mini"),
		model: heliconeAnthropic.languageModel("claude-3-5-sonnet-20241022", { cacheControl: true }),
		messages: llmMessages,
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "thread-respond",
		},
	});

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
