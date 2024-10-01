import { v4 as uuidv4 } from "uuid";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { commentThreadQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

import { useThreadComments } from "./hooks";

type ThreadCommentsReturnType = Awaited<ReturnType<typeof useThreadComments>["data"]>;

export const handleSubmitChat = async (commentId: string, thoughtId: string) => {
	const response = await fetch(apiClient.getUri({ url: "/api/ai/thread-respond" }), {
		method: "POST",
		// @ts-ignore
		headers: {
			...apiClient.defaults.headers.common,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			commentId,
			thoughtId,
		}),
	});

	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("Failed to get reader from response");
	}

	const newThreadCommentId = uuidv4();
	let fullText = "";
	let mdContent = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const chunk = new TextDecoder().decode(value);
		fullText += chunk;
		mdContent += chunk;

		// Extract suggestion content and replace with code block, supporting incomplete streaming
		const openTagIndex = fullText.lastIndexOf("<suggestion>");
		const closeTagIndex = fullText.lastIndexOf("</suggestion>");
		if (openTagIndex !== -1) {
			let suggestionContent = fullText.slice(openTagIndex + "<suggestion>".length);

			if (closeTagIndex !== -1 && closeTagIndex > openTagIndex) {
				suggestionContent = fullText.slice(openTagIndex + "<suggestion>".length, closeTagIndex);
				mdContent =
					mdContent.slice(0, openTagIndex) +
					"```\n" +
					suggestionContent +
					"\n```" +
					mdContent.slice(closeTagIndex + "</suggestion>".length);
			} else {
				// If closing tag is not found, replace only the opening tag
				mdContent = mdContent.slice(0, openTagIndex) + "```\n" + suggestionContent;
			}
		}

		// eslint-disable-next-line no-loop-func
		queryClient.setQueryData(commentThreadQueryKeys.threadComments(commentId), (data: ThreadCommentsReturnType) => {
			const newThreadComment = {
				id: newThreadCommentId,
				content: mdContent,
				comment_id: commentId,
				role: "assistant",
				created_at: new Date().toISOString(),
				status: "pending",
				applied_suggestion_hashes: [],
			};

			if (!data) {
				return [newThreadComment];
			}

			const newData = data.filter(comment => comment.id !== newThreadCommentId);

			return [...newData, newThreadComment];
		});
	}

	await supabase
		.from("thought_chat_threads")
		.insert({
			id: newThreadCommentId,
			content: mdContent,
			comment_id: commentId,
			role: "assistant",
		})
		.eq("id", commentId);

	queryClient.invalidateQueries({
		queryKey: commentThreadQueryKeys.threadComments(commentId),
	});
};
