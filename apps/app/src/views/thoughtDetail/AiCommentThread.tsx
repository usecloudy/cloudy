import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	CheckCircle2Icon,
	ChevronsLeftIcon,
	RefreshCwIcon,
	SendHorizonalIcon,
	SparklesIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

import { usePreviewContentStore } from "./previewContentStore";
import { useThreadStore } from "./threadStore";

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

const useRespond = (commentId: string) => {
	return useMutation({
		mutationFn: async (content: string) => {
			const { data } = await supabase
				.from("thought_chat_threads")
				.insert({
					comment_id: commentId,
					role: "user",
					content,
				})
				.single();

			await supabase
				.from("thought_chats")
				.update({
					is_thread_loading: true,
				})
				.eq("id", commentId);

			return data;
		},
		onMutate: content => {
			queryClient.setQueryData(["aiCommentThread", commentId], (data: any) => {
				if (data) {
					return {
						...data,
						is_thread_loading: true,
					};
				}
			});
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

export const AiCommentThread = ({ commentId }: { commentId: string }) => {
	const { setActiveThreadCommentId } = useThreadStore();
	const { setPreviewContent, apply } = usePreviewContentStore();

	const { data: comment, isLoading } = useAiCommentThread(commentId);
	const { mutate: respond, isPending } = useRespond(commentId);
	const { mutate: markAsApplied } = useMarkAsApplied(commentId);
	const { mutate: regenerate } = useRegenerate(commentId);

	const [textInput, setTextInput] = useState("");
	const threadRef = useRef<HTMLDivElement>(null);

	const canSubmit = textInput.length > 0;
	const isAnyLoading = isPending || isLoading || comment?.is_thread_loading;

	// Add this useEffect to scroll to bottom when comments change
	useEffect(() => {
		if (threadRef.current) {
			threadRef.current.scrollTo({
				top: threadRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [comment?.thought_chat_threads]);

	const handleSubmit = () => {
		respond(textInput);
		setTextInput("");
	};

	const handleBack = () => {
		setActiveThreadCommentId(null);
	};

	return (
		<div className="flex flex-col gap-4 w-full bg-card rounded-md p-4">
			<div className="flex items-center gap-1">
				<Button size="icon-sm" variant="ghost" onClick={handleBack} className="text-secondary">
					<ArrowLeftIcon className="w-5 h-5" />
				</Button>
				<h4 className="text-sm font-medium text-secondary">Thread</h4>
			</div>
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
			<div className="relative">
				<TextareaAutosize
					placeholder="Respond to Cloudy"
					className="w-full rounded-md bg-white/20 border-border border min-h-10 resize-none text-sm font-sans pl-3 pr-12 py-2 outline-none hover:outline-none focus:outline-none"
					value={textInput}
					onChange={e => setTextInput(e.target.value)}
					onKeyDown={e => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSubmit();
						}
					}}
				/>
				{canSubmit && (
					<div className="absolute right-1 top-1">
						<Button size="icon-sm" className="rounded animate-in zoom-in ease-out fade-in" onClick={handleSubmit}>
							<SendHorizonalIcon className="w-4 h-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

const ThreadComment = ({
	role,
	content,
	createdAt,
	hasSuggestion,
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
			<p className="whitespace-pre-wrap">{content}</p>
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
