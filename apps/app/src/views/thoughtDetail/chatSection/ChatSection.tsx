import { ChatRole, RepoReference, handleSupabaseError, makeHumanizedTime } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { Editor } from "@tiptap/react";
import { ArrowUpIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import { queryClient } from "src/api/queryClient";
import { chatThreadQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useUser } from "src/stores/user";
import { useWorkspace } from "src/stores/workspace";
import { cn } from "src/utils";

import { AiTextArea } from "../../aiTextArea/AiTextArea";
import { useExistingLinkedFiles } from "../hooks";
import { ThoughtContext } from "../thoughtContext";
import { ChatContent } from "./ChatContent";
import { UseThreadsForDocReturnType, triggerThread, useChatThread, useDeleteThread, useThreadsForDoc } from "./chat";

const getSelection = (editor: Editor) => {
	const currentMd = editor.storage.markdown.getMarkdown() as string;
	const firstEditStart = currentMd.indexOf("<edit>");
	const lastEditEnd = currentMd.lastIndexOf("</edit>") + 7; // 7 is the length of '</edit>'

	if (firstEditStart === -1 || lastEditEnd === -1) {
		return null;
	}

	return currentMd.substring(firstEditStart, lastEditEnd).replace(/<\/?edit>/g, "");
};

const useStartThread = () => {
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

const useReplyToThread = () => {
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

// const useEditSelection = () => {
// 	const { editor, thoughtId } = useContext(ThoughtContext);

// 	return useMutation({
// 		mutationFn: async ({ instruction, content }: { instruction: string; content: string }) => {
// 			if (!editor) {
// 				throw new Error("Editor is not initialized");
// 			}

// 			const firstEditStart = content.indexOf("<edit>");
// 			const lastEditEnd = content.lastIndexOf("</edit>") + 7; // 7 is the length of '</edit>'

// 			const preppedContent =
// 				content.substring(0, firstEditStart) +
// 				"[[[" +
// 				content.substring(firstEditStart, lastEditEnd).replace(/<\/?edit>/g, "") +
// 				"]]]" +
// 				content.substring(lastEditEnd);

// 			const response = await fetch(apiClient.getUri({ url: "/api/ai/edit-selection" }), {
// 				method: "POST",
// 				// @ts-ignore
// 				headers: {
// 					...apiClient.defaults.headers.common,
// 					"Content-Type": "application/json",
// 				},
// 				body: JSON.stringify({
// 					thoughtId,
// 					instruction,
// 					content: preppedContent,
// 				}),
// 			});

// 			if (!response.ok) {
// 				throw new Error(`HTTP error! status: ${response.status}`);
// 			}

// 			const reader = response.body?.getReader();
// 			if (!reader) {
// 				throw new Error("Failed to get reader from response");
// 			}

// 			let newEditingContent = "";
// 			let contentToSave = content;

// 			editor.commands.blur();

// 			const formContent = () => {
// 				// Remove leading and trailing backticks if present
// 				if (newEditingContent.startsWith("```html") || newEditingContent.startsWith("```")) {
// 					const startIndex = newEditingContent.indexOf("\n") + 1;
// 					newEditingContent = newEditingContent.substring(startIndex);
// 				}

// 				let suffix = "";
// 				if (!newEditingContent.endsWith("]]]")) {
// 					suffix = "]]]";
// 				}

// 				contentToSave =
// 					content.substring(0, firstEditStart) + newEditingContent + suffix + content.substring(lastEditEnd);
// 			};

// 			const replaceTokens = () => {
// 				const openingTokens = processSearches(editor.view.state.doc, "[[[", 0.99);
// 				const closingTokens = processSearches(editor.view.state.doc, "]]]", 0.99);

// 				if (openingTokens.length > 0 && closingTokens.length > 0) {
// 					editor
// 						.chain()
// 						.setTextSelection({
// 							from: openingTokens[0].from,
// 							to: closingTokens[0].to,
// 						})
// 						.setMark("additionHighlight")
// 						.deleteRange(closingTokens[0])
// 						.deleteRange(openingTokens[0])
// 						.run();
// 				}
// 			};

// 			const processChunks = async () => {
// 				while (true) {
// 					const { done, value } = await reader.read();
// 					if (done) break;
// 					const chunk = new TextDecoder().decode(value);
// 					newEditingContent += chunk;
// 					formContent();
// 					// Use requestAnimationFrame to schedule content updates
// 					editor.commands.setContent(contentToSave);
// 					replaceTokens();
// 				}
// 			};

// 			await processChunks();

// 			newEditingContent += "]]]";

// 			const finalContent = content.substring(0, firstEditStart) + newEditingContent + content.substring(lastEditEnd);
// 			editor.commands.setContent(finalContent);

// 			replaceTokens();
// 		},
// 	});
// };

export const ChatSection = () => {
	const { editor, hideAiEditor, thoughtId, threadId, setThreadId } = useContext(ThoughtContext);

	const { data: existingLinkedFiles } = useExistingLinkedFiles(thoughtId);

	const startThreadMutation = useStartThread();
	const replyToThreadMutation = useReplyToThread();

	const { data: threadsForDoc } = useThreadsForDoc(thoughtId);
	const { data: thread } = useChatThread(threadId);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const handleOnCancel = () => {
		hideAiEditor();
	};

	// const handleEditSelection = async () => {
	// 	if (!editor) {
	// 		throw new Error("Editor is not initialized");
	// 	}

	// 	const content = editor.getHTML();
	// 	setEditingText("");
	// 	disableUpdatesRef.current = true;
	// 	storeContentIfNeeded();
	// 	onStartAiEdits();
	// 	await editSelectionMutation.mutateAsync({ instruction: editingText, content });

	// 	setReadyToApply(true);
	// };

	const handleSubmit = async (text: string, fileReferences: RepoReference[]) => {
		if (threadId) {
			await replyToThreadMutation.mutateAsync({ threadId, content: text, fileReferences });
		} else {
			await handleStartThread(text, fileReferences);
		}
	};

	const handleStartThread = async (text: string, fileReferences: RepoReference[]) => {
		if (!editor) {
			throw new Error("Editor is not initialized");
		}

		const { id } = await startThreadMutation.mutateAsync({ content: text, fileReferences });
		setThreadId(id);
	};

	useHotkeys("esc", () => handleOnCancel());

	useEffect(() => {
		// For some reason, autofocus doesn't work and we have to manually focus the text area
		textAreaRef.current?.focus();
	}, []);

	const isThreadLoading = thread?.messages.some(message => message.role === ChatRole.Assistant && !message.completed_at);

	return (
		<div className="flex w-full flex-1 flex-col overflow-hidden">
			{thread && (
				<div className="flex flex-row items-center justify-center px-4 py-2">
					<Button variant="outline" size="sm" onClick={() => setThreadId(null)}>
						<ArrowUpIcon className="size-4" />
						<span>Exit thread</span>
					</Button>
				</div>
			)}
			<div className="flex flex-1 items-center justify-center overflow-hidden px-4">
				{thread ? (
					<ChatContent chatThread={thread} />
				) : threadsForDoc ? (
					<div className="no-scrollbar flex h-full w-full flex-col gap-2 overflow-y-auto py-4">
						<div className="flex flex-row items-center justify-between">
							<h3 className="text-lg font-semibold">Recent Threads</h3>
						</div>
						{threadsForDoc.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-y-2 text-secondary">
								<p>No chat threads yet</p>
								<p>Start a new conversation below</p>
							</div>
						) : (
							threadsForDoc.map(thread => (
								<ThreadButton key={thread.id} thread={thread} setThreadId={setThreadId} />
							))
						)}
					</div>
				) : (
					<LoadingSpinner />
				)}
			</div>
			<div className={cn("w-full border-t border-border px-4 py-4", isThreadLoading && "pointer-events-none opacity-70")}>
				<AiTextArea
					onSubmit={handleSubmit}
					onCancel={handleOnCancel}
					existingLinkedFiles={existingLinkedFiles}
					disableNewFileReference
					placeholder="Ask a question or describe the change you want to make"
					submitButtonText={threadId ? "Reply in thread" : "Start new thread"}
				/>
			</div>
		</div>
	);
};

const ThreadButton = ({
	thread,
	setThreadId,
}: {
	thread: UseThreadsForDocReturnType[number];
	setThreadId: (id: string) => void;
}) => {
	const deleteThreadMutation = useDeleteThread(thread.id);

	return (
		<button
			key={thread.id}
			onClick={e => {
				// Only set thread ID if not clicking dropdown item
				if (!(e.target as HTMLElement).closest(".dropdown-item")) {
					setThreadId(thread.id);
				}
			}}
			className="flex w-full flex-row items-center justify-between gap-x-2 rounded-lg border border-border p-4 text-left hover:bg-card">
			<div className="flex flex-col">
				<div className="text-xs text-secondary">{makeHumanizedTime(thread.created_at)}</div>
				<div className="line-clamp-2 text-sm">{thread.first_message[0]?.content || "Empty thread"}</div>
			</div>
			<Dropdown
				trigger={
					<Button variant="ghost" size="icon-sm">
						<MoreHorizontalIcon className="size-5" />
					</Button>
				}>
				<DropdownItem
					className="dropdown-item"
					onSelect={() => {
						deleteThreadMutation.mutate();
					}}>
					<TrashIcon className="size-4" />
					<span>Delete thread</span>
				</DropdownItem>
			</Dropdown>
		</button>
	);
};
