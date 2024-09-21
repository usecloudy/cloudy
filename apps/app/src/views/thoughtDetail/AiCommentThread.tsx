import { useMutation, useQuery } from "@tanstack/react-query";
import { diffLines } from "diff";
import { CheckCircle2Icon, ChevronsLeftIcon, RefreshCwIcon, SparklesIcon, UserIcon, XIcon } from "lucide-react";
import { useContext, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { useUnmount } from "react-use";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { useRespond } from "./hooks";
import { ThoughtContext } from "./thoughtContext";
import { useThoughtStore } from "./thoughtStore";

const useAiCommentThread = (commentId: string) => {
	useEffect(() => {
		const channel = supabase
			.channel("commentThread")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_chat_threads",
					filter: `comment_id=eq.${commentId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["aiCommentThread", commentId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [commentId]);

	useEffect(() => {
		const channel = supabase
			.channel("comment")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_chats",
					filter: `id=eq.${commentId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["aiCommentThread", commentId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [commentId]);

	return useQuery({
		queryKey: ["aiCommentThread", commentId],
		queryFn: async () => {
			const { data } = await supabase
				.from("thought_chats")
				.select("*, thought_chat_threads(*, created_at)")
				.eq("id", commentId)
				.order("created_at", { referencedTable: "thought_chat_threads", ascending: true })
				.single();

			return data;
		},
	});
};

const useRegenerate = (commentId: string) => {
	const mutationData = useRespond(commentId);
	return {
		...mutationData,
		mutate: () => {
			mutationData.mutate("Can you try again?");
		},
	};
};

const useMarkAsApplied = (commentId: string) => {
	return useMutation({
		mutationFn: async (threadId: string) => {
			await supabase
				.from("thought_chat_threads")
				.update({
					is_applied: true,
				})
				.eq("id", threadId);
		},
		onMutate: threadId => {
			queryClient.setQueryData(["aiCommentThread", commentId], (data: any) => {
				if (data) {
					return {
						...data,
						thought_chat_threads: data.thought_chat_threads.map((thread: any) => {
							if (thread.id === threadId) {
								return { ...thread, is_applied: true };
							}
							return thread;
						}),
					};
				}
			});
		},
	});
};

export const AiCommentThread = () => {
	const { activeThreadCommentId } = useThoughtStore();

	if (!activeThreadCommentId) {
		return null;
	}

	return <AiCommentThreadInner commentId={activeThreadCommentId} />;
};

const AiCommentThreadInner = ({ commentId }: { commentId: string }) => {
	const { data: comment, isLoading } = useAiCommentThread(commentId);

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
		<div ref={threadRef} className="no-scrollbar flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
			{comment ? (
				<>
					<ThreadComment
						threadCommentId={comment.id}
						role={comment.role as "user" | "assistant"}
						content={comment.content!}
						createdAt={comment.created_at}
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
							isApplied={threadComment.is_applied}
							regenerate={() => {
								regenerate();
							}}
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
	isLoadingSuggestion,
	isApplied,
	regenerate,
	isLast,
}: {
	threadCommentId: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	suggestion?: string | null;
	isLoadingSuggestion?: boolean;
	isApplied?: boolean;
	regenerate?: () => void;
	isLast?: boolean;
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

	const markAsAppliedMutation = useMarkAsApplied(threadCommentId);

	const currentIsPreviewing = previewingKey === threadCommentId;

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

	const applyPreviewContent = () => {
		if (!suggestion || !currentIsPreviewing) {
			return;
		}

		disableUpdatesRef.current = false;
		editor?.commands.setContent(suggestion);
		clearStoredContent();
		setIsEditingDisabled(false);
		setPreviewingKey(null);
		markAsAppliedMutation.mutate(threadCommentId);
	};

	const removePreviewContent = () => {
		if (currentIsPreviewing) {
			restoreFromLastContent();
			disableUpdatesRef.current = false;
			setIsEditingDisabled(false);
			setPreviewingKey(null);
		}
	};

	useUnmount(() => {
		removePreviewContent();
	});

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
				<Markdown>{content}</Markdown>
			</div>
			{isLoadingSuggestion && (
				<div className="flex flex-row items-center gap-1">
					<LoadingSpinner size="sm" />
				</div>
			)}
			{currentIsPreviewing ? (
				<div className="flex flex-row items-center gap-1">
					<Button size="sm" className="bg-green-600 hover:bg-green-600/60" onClick={applyPreviewContent}>
						<CheckCircle2Icon className="h-4 w-4" />
						<span>Apply changes</span>
					</Button>
					<Button size="sm" variant="destructive" onClick={removePreviewContent}>
						<XIcon className="h-4 w-4" />
						<span>Cancel</span>
					</Button>
				</div>
			) : (
				suggestion && (
					<div className="flex flex-row items-center gap-1">
						<Button
							size="sm"
							variant={isApplied ? "outline" : "secondary"}
							onClick={() => {
								showPreviewContent();
							}}
							className={cn({ "border-accent text-accent": isApplied })}
							disabled={isApplied}>
							{isApplied ? <CheckCircle2Icon className="h-4 w-4" /> : <ChevronsLeftIcon className="h-4 w-4" />}
							<span>{isApplied ? "Applied" : "Preview changes"}</span>
						</Button>
						{isLast && (
							<Button size="icon-sm" variant="secondary" onClick={regenerate}>
								<RefreshCwIcon className="h-4 w-4" />
							</Button>
						)}
					</div>
				)
			)}
		</div>
	);
};
