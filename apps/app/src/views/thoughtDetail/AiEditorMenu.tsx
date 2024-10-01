import { Hotkey } from "@cloudy/ui";
import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, SparklesIcon, XCircleIcon, XIcon } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import TextareaAutosize from "react-textarea-autosize";

import { apiClient } from "src/api/client";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { AiCommentThreadInner } from "./AiCommentThread";
import { handleSubmitChat } from "./chat";
import { useComment, useTemporaryComment, useThreadComments } from "./hooks";
import { ThoughtContext } from "./thoughtContext";

const useSelectionRespond = (commentId?: string | null) => {
	const { thoughtId } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ message, content }: { message: string; content: string }) => {
			const firstEditStart = content.indexOf("<edit>");
			const lastEditEnd = content.lastIndexOf("</edit>") + 7; // 7 is the length of '</edit>'

			const selection = content.substring(firstEditStart, lastEditEnd).replace(/<\/?edit>/g, "");

			let commentIdToSend = commentId;
			if (!commentIdToSend) {
				commentIdToSend = handleSupabaseError(
					await supabase
						.from("thought_chats")
						.insert({
							thought_id: thoughtId,
							content: message,
							related_chunks: [selection],
							role: "user",
							is_seen: true,
							is_thread_loading: true,
						})
						.select("id")
						.single(),
				).id;
			} else {
				handleSupabaseError(
					await supabase.from("thought_chat_threads").insert({
						comment_id: commentIdToSend,
						content: message,
						role: "user",
					}),
				);
				handleSupabaseError(
					await supabase
						.from("thought_chats")
						.update({
							is_thread_loading: true,
						})
						.eq("id", commentIdToSend),
				);
			}

			handleSubmitChat(commentIdToSend, thoughtId);

			return commentIdToSend;
		},
	});
};

const useEditSelection = () => {
	const { editor, thoughtId } = useContext(ThoughtContext);

	return useMutation({
		mutationFn: async ({ instruction, content }: { instruction: string; content: string }) => {
			if (!editor) {
				throw new Error("Editor is not initialized");
			}

			const firstEditStart = content.indexOf("<edit>");
			const lastEditEnd = content.lastIndexOf("</edit>") + 7; // 7 is the length of '</edit>'

			const preppedContent =
				content.substring(0, firstEditStart) +
				"[[[" +
				content.substring(firstEditStart, lastEditEnd).replace(/<\/?edit>/g, "") +
				"]]]" +
				content.substring(lastEditEnd);

			const response = await fetch(apiClient.getUri({ url: "/api/ai/edit-selection" }), {
				method: "POST",
				// @ts-ignore
				headers: {
					...apiClient.defaults.headers.common,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					thoughtId,
					instruction,
					content: preppedContent,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Failed to get reader from response");
			}

			let newEditingContent = "";
			let contentToSave = content;

			editor.commands.blur();

			const formContent = () => {
				// Remove leading and trailing backticks if present
				if (newEditingContent.startsWith("```html") || newEditingContent.startsWith("```")) {
					const startIndex = newEditingContent.indexOf("\n") + 1;
					newEditingContent = newEditingContent.substring(startIndex);
				}

				let suffix = "";
				if (!newEditingContent.endsWith("]]]")) {
					suffix = "]]]";
				}

				contentToSave =
					content.substring(0, firstEditStart) + newEditingContent + suffix + content.substring(lastEditEnd);
			};

			const replaceTokens = () => {
				const openingTokens = processSearches(editor.view.state.doc, "[[[", 0.99);
				const closingTokens = processSearches(editor.view.state.doc, "]]]", 0.99);

				if (openingTokens.length > 0 && closingTokens.length > 0) {
					editor
						.chain()
						.setTextSelection({
							from: openingTokens[0].from,
							to: closingTokens[0].to,
						})
						.setMark("additionHighlight")
						.deleteRange(closingTokens[0])
						.deleteRange(openingTokens[0])
						.run();
				}
			};

			const processChunks = async () => {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = new TextDecoder().decode(value);
					newEditingContent += chunk;
					formContent();
					// Use requestAnimationFrame to schedule content updates
					editor.commands.setContent(contentToSave);
					replaceTokens();
				}
			};

			await processChunks();

			newEditingContent += "]]]";

			const finalContent = content.substring(0, firstEditStart) + newEditingContent + content.substring(lastEditEnd);
			editor.commands.setContent(finalContent);

			replaceTokens();
		},
	});
};

export const AiEditorMenu = () => {
	const { isShowingAiEditorMenu } = useContext(ThoughtContext);

	return (
		<div className="sticky bottom-0 z-30 w-full">
			<div className="absolute bottom-4 left-0 flex w-full justify-center px-2 md:px-0">
				{isShowingAiEditorMenu && <AiEditorMenuContent />}
			</div>
		</div>
	);
};

const AiEditorMenuContent = () => {
	const { editor, disableUpdatesRef, storeContentIfNeeded, hideAiEditor, applySuggestedChanges, onStartAiEdits } =
		useContext(ThoughtContext);

	const [commentId, setCommentId] = useState<string | null>(null);
	const [editingText, setEditingText] = useState("");
	const [readyToApply, setReadyToApply] = useState(false);
	const [showOutline, setShowOutline] = useState(true);

	const editSelectionMutation = useEditSelection();
	const selectionRespondMutation = useSelectionRespond(commentId);

	const commentQuery = useComment(commentId);
	const threadCommentsQuery = useThreadComments(commentId);
	const temporaryCommentQuery = useTemporaryComment(commentId);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const handleOnCancel = () => {
		hideAiEditor();
	};

	const handleEditSelection = async () => {
		if (!editor) {
			throw new Error("Editor is not initialized");
		}

		const content = editor.getHTML();
		setEditingText("");
		disableUpdatesRef.current = true;
		storeContentIfNeeded();
		onStartAiEdits();
		await editSelectionMutation.mutateAsync({ instruction: editingText, content });

		setReadyToApply(true);
	};

	const handleSubmitQuestion = () => {
		if (!editor) {
			throw new Error("Editor is not initialized");
		}

		setEditingText("");
		selectionRespondMutation
			.mutateAsync({ message: editingText, content: editor.storage.markdown.getMarkdown() })
			.then(commentId => {
				setCommentId(commentId!);
			});
	};

	const handleConfirmChanges = () => {
		applySuggestedChanges();
		hideAiEditor();
	};

	useHotkeys("esc", () => handleOnCancel());

	useEffect(() => {
		// For some reason, autofocus doesn't work and we have to manually focus the text area
		textAreaRef.current?.focus();
		console.log("focus");
	}, []);

	useEffect(() => {
		setTimeout(() => {
			setShowOutline(false);
		}, 500);
	}, []);

	return (
		<div
			className={cn(
				"relative bottom-0 flex w-full flex-col gap-0.5 rounded-md border border-border bg-background outline outline-8 outline-accent/0 transition-all duration-100 ease-out animate-in zoom-in-95 slide-in-from-bottom-20 md:w-[32rem]",
				showOutline && "outline outline-2 outline-offset-2 outline-accent/80",
			)}>
			<div className="flex flex-row items-center justify-between gap-4 border-b border-border px-2 pb-1.5 pt-2">
				<div className="flex flex-row items-center gap-1 pb-1 pl-2 pt-1">
					<SparklesIcon className="h-4 w-4 text-accent" />
					<span className="text-sm font-medium">Let Cloudy help you out</span>
				</div>
				<Button variant="secondary" size="icon-xs" onClick={() => handleOnCancel()}>
					<XIcon className="h-4 w-4" />
				</Button>
			</div>
			{editSelectionMutation.isPending ? (
				<div className="flex items-center justify-center p-4">
					<LoadingSpinner size="sm" />
				</div>
			) : readyToApply ? (
				<>
					<div className="flex flex-col gap-1 px-4 py-2">
						<p className="text-sm">Here are the changes you requested!</p>
					</div>
					<div className="flex flex-row items-center justify-end gap-1 px-4 pb-4">
						<Button
							size="sm"
							variant="default"
							className="bg-green-600 hover:bg-green-600/80"
							onClick={handleConfirmChanges}>
							<CheckCircle2Icon className="size-4" />
							<span>Accept</span>
						</Button>
						<Button size="sm" variant="destructive" onClick={() => handleOnCancel()}>
							<XCircleIcon className="size-4" />
							<span>Reject</span>
						</Button>
					</div>
				</>
			) : (
				<>
					{commentQuery.data && (
						<div className="flex max-h-[30dvh] flex-1 border-b border-border px-4 md:max-h-[40dvh]">
							<AiCommentThreadInner
								comment={commentQuery.data}
								threadComments={threadCommentsQuery.data}
								temporaryComment={temporaryCommentQuery.data}
								isAnyLoading={commentQuery.isLoading || threadCommentsQuery.isLoading}
							/>
						</div>
					)}
					<div
						className={cn(
							"w-full px-4 pb-4",
							commentQuery.data?.is_thread_loading && "pointer-events-none opacity-70",
						)}>
						<TextareaAutosize
							ref={textAreaRef}
							className="no-scrollbar w-full resize-none appearance-none border-none bg-transparent px-2 py-3 text-sm outline-none"
							contentEditable={true}
							placeholder="Ask a question or describe the change you want to make"
							value={editingText}
							onChange={e => {
								setEditingText(e.target.value);
							}}
							onKeyDown={e => {
								if (e.key === "Enter" && !e.shiftKey && !e.metaKey) {
									e.preventDefault();
									handleSubmitQuestion();
								} else if (e.key === "Enter" && e.metaKey) {
									e.preventDefault();
									handleEditSelection();
								} else if (e.key === "Escape") {
									handleOnCancel();
								}
							}}
							suppressContentEditableWarning
							autoFocus
						/>
						{commentId ? (
							<div className="flex flex-row items-center justify-end gap-1">
								<Button size="sm" variant="default" onClick={handleSubmitQuestion}>
									<Hotkey keys={["Enter"]} />
									<span>Ask follow up</span>
								</Button>
							</div>
						) : (
							<div className="flex flex-row items-center justify-end gap-1">
								<Button size="sm" variant="ghost" onClick={handleEditSelection}>
									<Hotkey keys={["Command", "Enter"]} />
									<span>Edit</span>
								</Button>
								<Button size="sm" variant="default" onClick={handleSubmitQuestion}>
									<Hotkey keys={["Enter"]} />
									<span>Ask question</span>
								</Button>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
};
