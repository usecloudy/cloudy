import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { diffLines } from "diff";
import { CheckCircle2Icon, ChevronsLeftIcon, CopyIcon, RefreshCwIcon, SparklesIcon, UserIcon, XIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef } from "react";
import React from "react";
import Markdown from "react-markdown";
import { useUnmount } from "react-use";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { SuggestionContent } from "./SuggestionContent";
import { useCommentThread, useRespond } from "./hooks";
import { ThoughtContext } from "./thoughtContext";
import { useThoughtStore } from "./thoughtStore";

const useRegenerate = (commentId: string) => {
	const mutationData = useRespond(commentId);
	return {
		...mutationData,
		mutate: () => {
			mutationData.mutate("Can you try again?");
		},
	};
};

export const AiCommentThread = () => {
	const { activeThreadCommentId } = useThoughtStore();

	if (!activeThreadCommentId) {
		return null;
	}

	return <CommentThread commentId={activeThreadCommentId} />;
};

type CommentThreadType = ReturnType<typeof useCommentThread>["data"];

const CommentThread = ({ commentId }: { commentId: string }) => {
	const { data: comment, isLoading } = useCommentThread(commentId);

	return <AiCommentThreadInner commentId={commentId} comment={comment} isLoading={isLoading} />;
};

export const AiCommentThreadInner = ({
	commentId,
	comment,
	isLoading,
}: {
	commentId: string;
	comment: CommentThreadType;
	isLoading: boolean;
}) => {
	const { mutate: regenerate } = useRegenerate(commentId);

	const threadRef = useRef<HTMLDivElement>(null);

	const isAnyLoading = isLoading || comment?.is_thread_loading;

	// Add this useEffect to scroll to bottom when comments change
	useEffect(() => {
		if (threadRef.current) {
			threadRef.current.scrollTo({
				top: threadRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [comment?.thought_chat_threads]);

	return (
		<div ref={threadRef} className="no-scrollbar flex w-full flex-col gap-2 overflow-y-auto">
			{comment ? (
				<>
					<ThreadComment
						threadCommentId={comment.id}
						role={comment.role as "user" | "assistant"}
						content={comment.content!}
						createdAt={comment.created_at}
						appliedSuggestionHashes={[]}
						status="done"
					/>
					{comment.thought_chat_threads.map((threadComment, i, arr) => (
						<ThreadComment
							key={threadComment.id}
							threadCommentId={threadComment.id}
							role={threadComment.role as "user" | "assistant"}
							content={threadComment.content!}
							createdAt={threadComment.created_at}
							suggestion={threadComment.suggestion}
							isLoadingSuggestion={Boolean(threadComment.is_loading_suggestion)}
							appliedSuggestionHashes={threadComment.applied_suggestion_hashes}
							regenerate={() => {
								regenerate();
							}}
							status={threadComment.status as "pending" | "done"}
							isLast={i === arr.length - 1}
						/>
					))}
					{isAnyLoading && (
						<div className="flex size-12 items-center justify-center rounded bg-background p-3">
							<LoadingSpinner size="xs" />
						</div>
					)}
				</>
			) : isLoading ? (
				<div className="flex w-full items-center justify-center p-4">
					<LoadingSpinner size="sm" />
				</div>
			) : null}
		</div>
	);
};

const ThreadComment = ({
	threadCommentId,
	role,
	content,
	createdAt,
	suggestion,
	appliedSuggestionHashes,
	regenerate,
	isLast,
	status,
}: {
	threadCommentId: string;
	role: "user" | "assistant";
	content: string;
	appliedSuggestionHashes: string[];
	createdAt: string;
	suggestion?: string | null;
	isLoadingSuggestion?: boolean;
	regenerate?: () => void;
	isLast?: boolean;
	status: "pending" | "done";
}) => {
	const {
		editor,
		disableUpdatesRef,
		setIsEditingDisabled,
		previewingKey,
		setPreviewingKey,
		storeContentIfNeeded,
		restoreFromLastContent,
		clearStoredContent,
	} = useContext(ThoughtContext);

	const showPreviewContent = () => {
		if (!suggestion) {
			return;
		}

		storeContentIfNeeded();
		disableUpdatesRef.current = true;
		setIsEditingDisabled(true);
		setPreviewingKey(threadCommentId);

		const existingContentText = editor?.getText() ?? "";

		editor?.commands.setContent(suggestion);

		const newContentText = editor?.getText() ?? "";
		const diff = diffLines(existingContentText, newContentText);

		const addedLines = diff.filter(part => part.added);
		addedLines.forEach(part => {
			if (editor) {
				const lines = part.value.split("\n").filter(line => line.trim().length > 0);
				lines.forEach(line => {
					const results = processSearches(editor.state.doc, line);

					const firstResult = results?.at(0);

					if (firstResult) {
						editor.commands.setTextSelection(firstResult);
						editor.commands.setMark("additionHighlight");
					}
				});
			}
		});
	};

	// const applyPreviewContent = () => {
	// 	if (!suggestion || !currentIsPreviewing) {
	// 		return;
	// 	}

	// 	disableUpdatesRef.current = false;
	// 	editor?.commands.setContent(suggestion);
	// 	clearStoredContent();
	// 	setIsEditingDisabled(false);
	// 	setPreviewingKey(null);
	// 	markAsAppliedMutation.mutate(threadCommentId);
	// };

	// const removePreviewContent = () => {
	// 	if (currentIsPreviewing) {
	// 		restoreFromLastContent();
	// 		disableUpdatesRef.current = false;
	// 		setIsEditingDisabled(false);
	// 		setPreviewingKey(null);
	// 	}
	// };

	// useUnmount(() => {
	// 	removePreviewContent();
	// });

	return (
		<div className="flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-top-4 fill-mode-forwards hover:outline-accent/40">
			<div className="flex flex-row items-center justify-between gap-1">
				<div className="flex flex-row items-center gap-1">
					{role === "user" ? (
						<UserIcon className="h-4 w-4 text-secondary" />
					) : (
						<SparklesIcon className="h-4 w-4 text-accent" />
					)}
					<span className="text-xs font-medium text-secondary">{role === "user" ? "You" : "Cloudy"}</span>
				</div>
				<div className="text-xs text-secondary">{makeHumanizedTime(createdAt)}</div>
			</div>
			<div>
				<ThreadCommentContext.Provider value={{ status, appliedSuggestionHashes, threadCommentId }}>
					<Markdown
						components={{
							pre: SuggestionContent,
						}}>
						{content}
					</Markdown>
				</ThreadCommentContext.Provider>
			</div>
		</div>
	);
};

export const ThreadCommentContext = createContext<{
	status: "pending" | "done";
	threadCommentId: string;
	appliedSuggestionHashes: string[];
}>({
	threadCommentId: "",
	appliedSuggestionHashes: [],
	status: "pending",
});
