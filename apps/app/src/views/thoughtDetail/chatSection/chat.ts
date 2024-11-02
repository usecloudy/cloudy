import { ChatRole, RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Editor } from "@tiptap/react";
import { produce } from "immer";
import { createContext, useContext } from "react";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { chatThreadQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";

import { ThoughtContext } from "../thoughtContext";

export const triggerThread = async (threadId: string) => {
	const newMessage = handleSupabaseError(
		await supabase
			.from("chat_messages")
			.insert({
				thread_id: threadId,
				role: ChatRole.Assistant,
				content: "",
			})
			.select("*")
			.single(),
	);

	const response = await fetch(apiClient.getUri({ url: "/api/ai/thread-respond" }), {
		method: "POST",
		// @ts-ignore
		headers: {
			...apiClient.defaults.headers.common,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messageId: newMessage.id,
			threadId,
		}),
	});

	const reader = response.body?.getReader();
	if (!reader) {
		throw new Error("Failed to get reader from response");
	}

	let fullText = "";
	let mdContent = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		const chunk = new TextDecoder().decode(value);
		fullText += chunk;

		// Remove lines that start with ```
		fullText = fullText
			.split("\n")
			.map(line => {
				if (line.trim().startsWith("```")) {
					return line.replace("```", "\\`\\`\\`");
				}
				return line;
			})
			.join("\n");

		mdContent = fullText;

		// Extract and replace all suggestion blocks
		const suggestionRegex = /<suggestion>([\s\S]*?)<\/suggestion>/g;
		let match;
		while ((match = suggestionRegex.exec(fullText)) !== null) {
			const suggestionContent = match[1];
			mdContent = mdContent.replace(match[0], `\`\`\`\n${suggestionContent.trim()}\n\`\`\``);
		}

		// Any remaining opening suggestion tags that don't have a closing tag should be temporarily added to the content
		if (mdContent.includes("<suggestion>")) {
			mdContent = mdContent.replace("<suggestion>", "```");
		}

		mdContent = mdContent
			.split("\n")
			.map(line => {
				if (line.trim().startsWith("```")) {
					return line.trim();
				}
				return line;
			})
			.join("\n");

		// eslint-disable-next-line no-loop-func
		queryClient.setQueryData(chatThreadQueryKeys.thread(threadId), (data: UseChatThreadReturnType) =>
			produce(data, draft => {
				if (draft) {
					const newMessages = draft.messages.filter(message => message.id !== newMessage.id);

					newMessages.push({
						...newMessage,
						content: mdContent,
					});

					draft.messages = newMessages;
				}
			}),
		);
	}

	await supabase
		.from("chat_messages")
		.update({
			content: mdContent,
			completed_at: new Date().toISOString(),
		})
		.eq("id", newMessage.id);

	queryClient.invalidateQueries({
		queryKey: chatThreadQueryKeys.thread(threadId),
	});
};

export const useChatThread = (threadId?: string | null) => {
	return useQuery({
		queryKey: chatThreadQueryKeys.thread(threadId),
		queryFn: async () => {
			if (!threadId) {
				return null;
			}

			const thread = handleSupabaseError(
				await supabase.from("chat_threads").select("*, messages:chat_messages(*)").eq("id", threadId).single(),
			);

			thread.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

			return thread;
		},
		enabled: !!threadId,
	});
};

export type UseChatThreadReturnType = NonNullable<ReturnType<typeof useChatThread>["data"]>;

export const ChatMessageContext = createContext<{
	message: UseChatThreadReturnType["messages"][number];
}>({
	message: {
		id: "",
		role: "user",
		content: "",
		created_at: "",
		applied_suggestion_hashes: [],
		completed_at: null,
		thread_id: "",
		user_id: null,
		selection_text: null,
	},
});

export const useThreadsForDoc = (docId: string) => {
	return useQuery({
		queryKey: thoughtQueryKeys.threadsForDoc(docId),
		queryFn: async () => {
			return handleSupabaseError(
				await supabase
					.from("chat_threads")
					.select("*, first_message:chat_messages!chat_messages_thread_id_fkey(*)")
					.eq("document_id", docId)
					.order("created_at", { ascending: false })
					.order("created_at", { referencedTable: "first_message", ascending: true })
					.limit(1, { referencedTable: "first_message" }),
			);
		},
	});
};

export type UseThreadsForDocReturnType = NonNullable<ReturnType<typeof useThreadsForDoc>["data"]>;

export const useDeleteThread = (threadId: string) => {
	const { thoughtId: docId } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async () => {
			await supabase.from("chat_threads").delete().eq("id", threadId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: chatThreadQueryKeys.thread(threadId),
			});
			queryClient.invalidateQueries({
				queryKey: thoughtQueryKeys.threadsForDoc(docId),
			});
		},
	});
};

export const getSelection = (editor: Editor) => {
	const currentMd = editor.storage.markdown.getMarkdown() as string;
	const firstEditStart = currentMd.indexOf("<edit>");
	const lastEditEnd = currentMd.lastIndexOf("</edit>") + 7; // 7 is the length of '</edit>'

	if (firstEditStart === -1 || lastEditEnd === -1) {
		return null;
	}

	return currentMd.substring(firstEditStart, lastEditEnd).replace(/<\/?edit>/g, "");
};

export const useStartThread = () => {
	const workspace = useWorkspace();
	const user = useUser();

	const { thoughtId, editor } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ content }: { content: string; fileReferences?: RepoReference[] }) => {
			const selection = getSelection(editor!);

			const thread = handleSupabaseError(
				await supabase
					.from("chat_threads")
					.insert({
						workspace_id: workspace.id,
						document_id: thoughtId,
					})
					.select("*")
					.single(),
			);

			handleSupabaseError(
				await supabase
					.from("chat_messages")
					.insert({
						thread_id: thread.id,
						content,
						role: ChatRole.User,
						user_id: user.id,
						selection_text: selection,
					})
					.select("*")
					.single(),
			);

			triggerThread(thread.id);

			return thread;
		},
		onSuccess: thread => {
			if (thread.document_id) {
				queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.threadsForDoc(thread.document_id) });
			}
		},
	});
};

export const useReplyToThread = () => {
	const user = useUser();

	const { editor } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ threadId, content }: { threadId: string; content: string; fileReferences?: RepoReference[] }) => {
			const selection = getSelection(editor!);

			const message = handleSupabaseError(
				await supabase
					.from("chat_messages")
					.insert({
						thread_id: threadId,
						content,
						role: ChatRole.User,
						user_id: user.id,
						selection_text: selection,
					})
					.select("*")
					.single(),
			);

			triggerThread(threadId);

			return message;
		},
		onSuccess: (_, { threadId }) => {
			queryClient.invalidateQueries({ queryKey: chatThreadQueryKeys.thread(threadId) });
		},
	});
};
