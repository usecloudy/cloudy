import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2Icon, ChevronsLeftIcon, RefreshCwIcon, SparklesIcon, UserIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import Markdown from "react-markdown";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

import { useRespond } from "./hooks";
import { usePreviewContentStore } from "./previewContentStore";
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
	const { setPreviewContent, apply } = usePreviewContentStore();

	const { data: comment, isLoading } = useAiCommentThread(commentId);

	const { mutate: markAsApplied } = useMarkAsApplied(commentId);
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
		<div ref={threadRef} className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] no-scrollbar">
			{comment ? (
				<>
					<ThreadComment
						role={comment.role as "user" | "assistant"}
						content={comment.content!}
						createdAt={comment.created_at}
					/>
					{comment.thought_chat_threads.map((threadComment, i, arr) => (
						<ThreadComment
							key={threadComment.id}
							role={threadComment.role as "user" | "assistant"}
							content={threadComment.content!}
							createdAt={threadComment.created_at}
							hasSuggestion={Boolean(threadComment.suggestion)}
							isLoadingSuggestion={Boolean(threadComment.is_loading_suggestion)}
							isApplied={threadComment.is_applied}
							onMouseEnter={() => {
								setPreviewContent(threadComment.suggestion);
							}}
							onMouseLeave={() => {
								setPreviewContent(null);
							}}
							apply={() => {
								apply();
								markAsApplied(threadComment.id);
							}}
							regenerate={() => {
								regenerate();
							}}
							isLast={i === arr.length - 1}
						/>
					))}
					{isAnyLoading && (
						<div className="bg-background rounded flex justify-center items-center size-12 p-3">
							<LoadingSpinner size="xs" />
						</div>
					)}
				</>
			) : isLoading ? (
				<div className="flex justify-center items-center w-full p-4">
					<LoadingSpinner size="sm" />
				</div>
			) : null}
		</div>
	);
};

const ThreadComment = ({
	role,
	content,
	createdAt,
	hasSuggestion,
	isLoadingSuggestion,
	onMouseEnter,
	onMouseLeave,
	apply,
	isApplied,
	regenerate,
	isLast,
}: {
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	hasSuggestion?: boolean;
	isLoadingSuggestion?: boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	apply?: () => void;
	isApplied?: boolean;
	regenerate?: () => void;
	isLast?: boolean;
}) => {
	return (
		<div className="flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-top-4 fill-mode-forwards hover:outline-accent/40">
			<div className="flex flex-row items-center justify-between gap-1">
				<div className="flex flex-row items-center gap-1">
					{role === "user" ? (
						<UserIcon className="w-4 h-4 text-secondary" />
					) : (
						<SparklesIcon className="w-4 h-4 text-accent" />
					)}
					<span className="text-xs font-medium text-secondary">{role === "user" ? "You" : "Cloudy"}</span>
				</div>
				<div className="text-xs text-secondary">{makeHumanizedTime(createdAt)}</div>
			</div>
			<div>
				<Markdown>{content}</Markdown>
			</div>
			{isLoadingSuggestion && (
				<div className="flex flex-row gap-1 items-center">
					<LoadingSpinner size="sm" />
				</div>
			)}
			{hasSuggestion && (
				<div className="flex flex-row gap-1 items-center">
					<Button
						size="sm"
						variant={isApplied ? "outline" : "secondary"}
						onMouseEnter={onMouseEnter}
						onMouseLeave={onMouseLeave}
						onClick={apply}
						className={cn({ "text-accent border-accent": isApplied })}
						disabled={isApplied}>
						{isApplied ? <CheckCircle2Icon className="w-4 h-4" /> : <ChevronsLeftIcon className="w-4 h-4" />}
						<span>{isApplied ? "Applied" : "Apply"}</span>
					</Button>
					{isLast && (
						<Button size="icon-sm" variant="secondary" onClick={regenerate}>
							<RefreshCwIcon className="w-4 h-4" />
						</Button>
					)}
				</div>
			)}
		</div>
	);
};
