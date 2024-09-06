import { ThoughtSignals } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { useMutation } from "@tanstack/react-query";
import {
	ArchiveIcon,
	ArchiveRestoreIcon,
	ArrowLeftIcon,
	ChevronsLeftIcon,
	CircleDotIcon,
	EyeIcon,
	LightbulbIcon,
	MessageCircleIcon,
	MessageCircleQuestionIcon,
	MessageCircleReplyIcon,
	MoreHorizontalIcon,
	PauseIcon,
	PencilIcon,
	PinIcon,
	PinOffIcon,
	PlayIcon,
	SparklesIcon,
	TrashIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useMount, useUnmount } from "react-use";
import { create } from "zustand";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useHighlightStore } from "src/stores/highlight";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

import { AiCommentThread } from "./AiCommentThread";
import { AiInputBar } from "./AiInputBar";
import { useComments, useThought } from "./hooks";
import { CommentFilter, useThoughtStore } from "./thoughtStore";
import { useTitleStore } from "./titleStore";

// Types
type Suggestion = Database["public"]["Tables"]["thought_chats"]["Row"];
type SuggestionWithThreadCount = Suggestion & { threadCount: number };

const emptyStateMessage = "Once Cloudy understands what you're thinking about, you will see suggestions here.";

const useScrollStateStore = create<{
	scrollValue: number;
	setScrollValue: (scrollValue: number) => void;
}>(set => ({
	scrollValue: 0,
	setScrollValue: scrollValue => set({ scrollValue }),
}));

// Hooks

const useDeleteComment = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (commentId: string) => {
			const { error } = await supabase.from("thought_chats").delete().eq("id", commentId);
			if (error) throw error;
			return commentId;
		},
		onSuccess: commentId => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.filter(suggestion => suggestion.id !== commentId),
			);
		},
	});
};

const usePinComment = (thoughtId: string) => {
	return useMutation({
		mutationFn: async ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) => {
			const { error } = await supabase
				.from("thought_chats")
				.update({ is_pinned: isPinned, ...(isPinned ? { is_archived: false } : {}) })
				.eq("id", commentId);
			if (error) throw error;
			return commentId;
		},
		onMutate: ({ commentId, isPinned }) => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.map(suggestion => (suggestion.id === commentId ? { ...suggestion, is_pinned: isPinned } : suggestion)),
			);
		},
	});
};

const useMarkAsSeen = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (commentId: string) => {
			const { error } = await supabase.from("thought_chats").update({ is_seen: true }).eq("id", commentId);
			if (error) throw error;
			return commentId;
		},
		onMutate: (commentId: string) => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.map(suggestion => (suggestion.id === commentId ? { ...suggestion, is_seen: true } : suggestion)),
			);
		},
	});
};

const useArchiveComment = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (commentId: string) => {
			const { error } = await supabase.from("thought_chats").update({ is_archived: true }).eq("id", commentId);
			if (error) throw error;
			return commentId;
		},
		onMutate: (commentId: string) => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.map(suggestion => (suggestion.id === commentId ? { ...suggestion, is_archived: true } : suggestion)),
			);
		},
	});
};

const useUnarchiveComment = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (commentId: string) => {
			const { error } = await supabase.from("thought_chats").update({ is_archived: false }).eq("id", commentId);
			if (error) throw error;
			return commentId;
		},
		onMutate: (commentId: string) => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.map(suggestion => (suggestion.id === commentId ? { ...suggestion, is_archived: false } : suggestion)),
			);
		},
	});
};

const useMarkAllAsRead = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (isArchived: boolean = false) => {
			const { error } = await supabase
				.from("thought_chats")
				.update({ is_seen: true })
				.eq("thought_id", thoughtId)
				.eq("is_archived", isArchived);
			if (error) throw error;
		},
		onMutate: () => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.map(suggestion => ({ ...suggestion, is_seen: true })),
			);
		},
	});
};

const useArchive = (thoughtId: string, commentFilter: CommentFilter | null) => {
	return useMutation({
		mutationFn: async () => {
			let query = supabase
				.from("thought_chats")
				.update({ is_archived: true })
				.not("is_pinned", "eq", true)
				.eq("thought_id", thoughtId);
			if (commentFilter) {
				query = query.in("id", commentFilter.commentIds);
			}
			const { error } = await query;
			if (error) throw error;
		},
		onMutate: () => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.filter(suggestion => {
					if (commentFilter) {
						return !commentFilter.commentIds.includes(suggestion.id);
					}
					return suggestion.is_pinned;
				}),
			);
		},
	});
};

const useDeleteAllArchived = (thoughtId: string) => {
	return useMutation({
		mutationFn: async () => {
			const { error } = await supabase.from("thought_chats").delete().eq("thought_id", thoughtId).eq("is_archived", true);
			if (error) throw error;
		},
		onMutate: () => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.filter(suggestion => !suggestion.is_archived),
			);
		},
	});
};

const useGenerateSuggestion = () => {
	return useMutation({
		mutationFn: async (commentId: string) => {
			const { data } = await supabase
				.from("thought_chat_threads")
				.insert({
					comment_id: commentId,
					role: "user",
					content: "Can you show me?",
				})
				.single();

			await supabase
				.from("thought_chats")
				.update({
					is_thread_loading: true,
				})
				.eq("id", commentId);

			return { commentId };
		},
		onMutate: commentId => {
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

const useThoughtSuggestionIsPaused = (thoughtId: string) => {
	const { data: thought } = useThought(thoughtId);
	return thought?.is_suggestion_paused;
};

const useSetSuggestionPaused = (thoughtId: string) => {
	return useMutation({
		mutationFn: async (isPaused: boolean) => {
			const { error } = await supabase.from("thoughts").update({ is_suggestion_paused: isPaused }).eq("id", thoughtId);
			if (error) throw error;
		},
	});
};

const useIsAiSuggestionLoading = (thoughtId: string) => {
	const { data: thought } = useThought(thoughtId);
	return useMemo(() => {
		const signals = thought?.signals as string[] | null;
		return signals?.includes(ThoughtSignals.AI_SUGGESTIONS);
	}, [thought?.signals]);
};

// Helper functions
const IconForType = ({ type, role }: { type: string; role: "user" | "assistant" }) => {
	if (role === "user") {
		return <UserIcon className="text-tertiary h-3.5 w-3.5" />;
	}

	const iconMap: { [key: string]: JSX.Element } = {
		suggestion: <LightbulbIcon className="text-tertiary ml-[-0.15rem] h-3.5 w-3.5" />,
		comment: <MessageCircleIcon className="text-tertiary h-3.5 w-3.5" />,
		question: <MessageCircleQuestionIcon className="text-tertiary h-3.5 w-3.5" />,
		title_suggestion: <PencilIcon className="text-tertiary h-3 w-3" />,
	};
	return iconMap[type] || <MessageCircleIcon className="text-tertiary h-3.5 w-3.5" />;
};

const titleForType = (type: string, role: string) => {
	if (role === "user") {
		return "You";
	}
	const titleMap: { [key: string]: string } = {
		suggestion: "Suggestion",
		comment: "Comment",
		question: "Question",
		action: "Action",
		idea: "Idea",
		title_suggestion: "Title Suggestion",
	};
	return titleMap[type] || "Suggestion";
};

export const AiFeed = ({ thoughtId }: { thoughtId?: string }) => {
	if (!thoughtId) return <EmptyState />;

	return <AiFeedInner thoughtId={thoughtId} />;
};

// Main component
export const AiFeedInner = ({ thoughtId }: { thoughtId: string }) => {
	const isAiSuggestionLoading = useIsAiSuggestionLoading(thoughtId);
	const { data: ideaSuggestions } = useComments(thoughtId);
	const isSuggestionPaused = useThoughtSuggestionIsPaused(thoughtId);
	const { feedMode, setFeedMode, commentFilter, setCommentFilter, setActiveThreadCommentId } = useThoughtStore();

	const { mutate: markAllAsRead } = useMarkAllAsRead(thoughtId);
	const { mutate: archive } = useArchive(thoughtId, commentFilter);
	const { mutate: setSuggestionPaused } = useSetSuggestionPaused(thoughtId);
	const { mutate: deleteAllArchived } = useDeleteAllArchived(thoughtId);

	const isUnseenCount = ideaSuggestions.filter(suggestion => !suggestion.is_seen && !suggestion.is_archived).length ?? 0;

	const suggestions = useMemo(() => {
		return feedMode === "archive"
			? ideaSuggestions.filter(suggestion => suggestion.is_archived)
			: ideaSuggestions.filter(
					suggestion =>
						!suggestion.is_archived && (!commentFilter || commentFilter.commentIds.includes(suggestion.id)),
				);
	}, [feedMode, ideaSuggestions, commentFilter]);

	useEffect(() => {
		if (feedMode === "selectedComments" && suggestions.length === 0) {
			setCommentFilter(null);
		}
	}, [feedMode, suggestions, setCommentFilter]);

	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-md border border-border bg-card p-4 w-full md:w-2/3 lg:w-full thought-feed-view",
				feedMode === "selectedComments" && "ring-2 ring-accent/40 ring-offset-2 ring-offset-background",
			)}>
			{feedMode === "archive" ? (
				<div className="flex flex-row items-center justify-between gap-1">
					<div className="flex flex-row items-center gap-1">
						<Button
							size="icon-xs"
							variant="ghost"
							className="text-secondary"
							onClick={() => setFeedMode("default")}>
							<ArrowLeftIcon className="h-4 w-4" />
						</Button>
						<h4 className="text-sm font-medium text-secondary">Archived Suggestions</h4>
					</div>
					<div className="flex flex-row items-center gap-1 relative">
						<Dropdown
							trigger={
								<Button size="icon-xs" variant="ghost" className="text-secondary">
									<MoreHorizontalIcon className="h-4 w-4" />
								</Button>
							}>
							<DropdownItem onSelect={() => markAllAsRead(true)}>
								<EyeIcon className="h-4 w-4" />
								<span>Mark all archived as read</span>
							</DropdownItem>
							<DropdownItem onSelect={() => deleteAllArchived()}>
								<TrashIcon className="h-4 w-4" />
								<span>Delete all archived</span>
							</DropdownItem>
						</Dropdown>
					</div>
				</div>
			) : feedMode === "selectedComments" ? (
				<div className="flex flex-row items-center justify-between gap-1">
					<div className="flex flex-row items-center gap-2">
						<div className="flex flex-row items-center gap-1">
							<Button
								size="icon-xs"
								variant="ghost"
								className="text-secondary"
								onClick={() => setCommentFilter(null)}>
								<ArrowLeftIcon className="h-4 w-4" />
							</Button>
							<h4 className="text-sm font-medium text-secondary">Comments</h4>
						</div>
					</div>
					<div className="flex flex-row items-center gap-2">
						<div className="flex flex-row items-center gap-1 relative">
							<Dropdown
								trigger={
									<Button size="icon-xs" variant="ghost" className="text-secondary">
										<MoreHorizontalIcon className="h-4 w-4" />
									</Button>
								}>
								<DropdownItem onSelect={() => archive()}>
									<TrashIcon className="h-4 w-4" />
									<span>Archive selected</span>
								</DropdownItem>
							</Dropdown>
						</div>
					</div>
				</div>
			) : feedMode === "thread" ? (
				<div className="flex flex-row items-center justify-between gap-1">
					<div className="flex flex-row items-center gap-2">
						<div className="flex flex-row items-center gap-1">
							<Button
								size="icon-xs"
								variant="ghost"
								className="text-secondary"
								onClick={() => setActiveThreadCommentId(null)}>
								<ArrowLeftIcon className="h-4 w-4" />
							</Button>
							<h4 className="text-sm font-medium text-secondary">Thread</h4>
						</div>
					</div>
				</div>
			) : (
				<div className="flex flex-row items-center justify-between gap-1">
					<div className="flex flex-row items-center gap-2">
						<div className="flex flex-row items-center gap-1">
							<SparklesIcon className="h-4 w-4 text-accent" />
							<h4 className="text-sm font-medium text-secondary">Cloudy's Suggestions</h4>
						</div>
						<div className="flex flex-row items-center gap-1">
							{isUnseenCount > 0 && (
								<span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/90 text-[10px] text-white">
									{isUnseenCount}
								</span>
							)}
							{isSuggestionPaused && (
								<span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-secondary text-[10px]">
									<PauseIcon className="h-2.5 w-2.5 stroke-none fill-white " />
								</span>
							)}
							{isAiSuggestionLoading && <LoadingSpinner size="xs" />}
						</div>
					</div>
					<div className="flex flex-row items-center gap-2">
						<Button
							size="icon-xs"
							variant="ghost"
							className="text-secondary"
							onClick={() => setFeedMode("archive")}>
							<ArchiveIcon className="h-4 w-4" />
						</Button>
						<div className="flex flex-row items-center gap-1 relative">
							<Dropdown
								trigger={
									<Button size="icon-xs" variant="ghost" className="text-secondary">
										<MoreHorizontalIcon className="h-4 w-4" />
									</Button>
								}>
								{isSuggestionPaused ? (
									<DropdownItem
										onSelect={() => setSuggestionPaused(false)}
										className="bg-accent-secondary/10 font-medium">
										<PlayIcon className="h-4 w-4" />
										<span>Resume suggestions</span>
									</DropdownItem>
								) : (
									<DropdownItem onSelect={() => setSuggestionPaused(true)}>
										<PauseIcon className="h-4 w-4" />
										<span>Pause suggestions</span>
									</DropdownItem>
								)}
								<DropdownItem onSelect={() => markAllAsRead(false)}>
									<EyeIcon className="h-4 w-4" />
									<span>Mark all as read</span>
								</DropdownItem>
								<DropdownItem onSelect={() => archive()}>
									<TrashIcon className="h-4 w-4" />
									<span>Archive all (Except pinned)</span>
								</DropdownItem>
							</Dropdown>
						</div>
					</div>
				</div>
			)}
			{feedMode === "thread" ? (
				<AiCommentThread />
			) : (
				<IdeaSuggestionList thoughtId={thoughtId} suggestions={suggestions} />
			)}
			{(feedMode === "default" || feedMode === "thread") && <AiInputBar />}
		</div>
	);
};

const IdeaSuggestionList = ({ thoughtId, suggestions }: { thoughtId: string; suggestions: SuggestionWithThreadCount[] }) => {
	const { scrollValue, setScrollValue } = useScrollStateStore();

	const ref = useRef<HTMLDivElement>(null);
	const scrollRef = useRef(0);

	useMount(() => {
		if (ref.current) {
			ref.current.scrollTo({ top: scrollValue, behavior: "instant" });

			const scrollHandler = () => {
				scrollRef.current = ref.current?.scrollTop ?? 0;
			};

			ref.current.addEventListener("scroll", scrollHandler);

			return () => {
				ref.current?.removeEventListener("scroll", scrollHandler);
			};
		}

		setScrollValue(0);
	});

	useUnmount(() => {
		setScrollValue(scrollRef.current);
	});

	return (
		<div className="no-scrollbar flex max-h-[28rem] flex-col gap-2 overflow-y-auto scroll-smooth p-1" ref={ref}>
			{suggestions.length > 0 ? (
				suggestions.map((suggestion, index) => (
					<IdeaSuggestion thoughtId={thoughtId} suggestion={suggestion} index={index} />
				))
			) : (
				<div className="text-tertiary text-sm">{emptyStateMessage}</div>
			)}
		</div>
	);
};

const IdeaSuggestion = ({
	thoughtId,
	suggestion,
	index,
}: {
	thoughtId: string;
	suggestion: SuggestionWithThreadCount;
	index: number;
}) => {
	const { setHighlights } = useHighlightStore();
	const { setTitle } = useTitleStore();
	const { setActiveThreadCommentId } = useThoughtStore();

	const { mutate: deleteComment } = useDeleteComment(thoughtId);
	const { mutate: pinComment } = usePinComment(thoughtId);
	const { mutate: markAsSeen } = useMarkAsSeen(thoughtId);
	const { mutate: generateSuggestion } = useGenerateSuggestion();
	const { mutate: archiveComment } = useArchiveComment(thoughtId);
	const { mutate: unarchiveComment } = useUnarchiveComment(thoughtId);

	const handleMouseEnter = (suggestion: Suggestion) => {
		setHighlights(suggestion.related_chunks?.map(chunk => ({ text: chunk })) || []);
		if (!suggestion.is_seen) {
			markAsSeen(suggestion.id);
		}
	};

	const clearHighlights = () => setHighlights([]);

	const handleApplyTitle = () => {
		setTitle(suggestion.content!, true);
		deleteComment(suggestion.id);
	};

	const handleReply = () => {
		clearHighlights();
		setActiveThreadCommentId(suggestion.id);
	};

	const handlePin = () => {
		clearHighlights();
		pinComment({
			commentId: suggestion.id,
			isPinned: !suggestion.is_pinned,
		});
	};

	const handleArchive = () => {
		clearHighlights();
		archiveComment(suggestion.id);
	};

	const handleUnarchive = () => {
		clearHighlights();
		unarchiveComment(suggestion.id);
	};

	const handleDelete = () => {
		clearHighlights();
		deleteComment(suggestion.id);
	};

	const handleGenerate = () => {
		handleReply();
		generateSuggestion(suggestion.id);
	};

	return (
		<div
			key={suggestion.id}
			className={cn(
				"flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards",
				index > 0 && `delay-${index * 100}`,
				suggestion.related_chunks && suggestion.related_chunks.length > 0 && "hover:outline hover:outline-accent/40",
			)}
			onMouseEnter={() => handleMouseEnter(suggestion)}
			onMouseLeave={clearHighlights}>
			<div className="flex w-full flex-row items-center justify-between gap-2 text-xs text-secondary">
				<div className="flex flex-row items-center gap-1 font-medium">
					<IconForType type={suggestion.type} role={suggestion.role as "user" | "assistant"} />
					{titleForType(suggestion.type, suggestion.role)}
				</div>
				<div className="flex flex-row items-center gap-1">
					{suggestion.is_pinned && <PinIcon className="h-3 w-3 text-accent fill-accent" />}
					<span>{makeHumanizedTime(suggestion.created_at)}</span>
					{!suggestion.is_seen && <CircleDotIcon className="h-2 w-2 text-accent fill-accent" />}
				</div>
			</div>
			<div
				className={cn({
					"text-secondary": suggestion.is_archived,
				})}>
				{suggestion.content}
			</div>
			<div className="flex flex-row items-center justify-between gap-2">
				<div className="flex flex-row items-center gap-1">
					<Button variant="secondary" size="sm" onClick={handleReply}>
						{suggestion.threadCount === 0 ? (
							<>
								<MessageCircleReplyIcon className="h-4 w-4" />
								<span>Reply</span>
							</>
						) : (
							<>
								<MessageCircleIcon className="h-4 w-4" />
								<span>{`Thread (${suggestion.threadCount})`}</span>
							</>
						)}
					</Button>
					{suggestion.type === "title_suggestion" && (
						<Button size="sm" variant="secondary" onClick={handleApplyTitle}>
							<ChevronsLeftIcon className="h-4 w-4" />
							<span>Apply</span>
						</Button>
					)}
					{suggestion.type !== "title_suggestion" && suggestion.role !== "user" && (
						<Button size="sm" variant="secondary" className="text-accent" onClick={handleGenerate}>
							<SparklesIcon className="h-3.5 w-3.5" />
							<span>Show me</span>
						</Button>
					)}
				</div>
				{suggestion.is_archived ? (
					<div className="flex flex-row items-center gap-4 py-1">
						<Button variant="ghost" size="icon-sm-overflow" className="text-secondary" onClick={handleUnarchive}>
							<ArchiveRestoreIcon className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon-sm-overflow" className="text-secondary" onClick={handleDelete}>
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				) : (
					<div className="flex flex-row items-center gap-4 py-1">
						<Button variant="ghost" size="icon-sm-overflow" className="text-secondary" onClick={handlePin}>
							{suggestion.is_pinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
						</Button>
						<Button variant="ghost" size="icon-sm-overflow" className="text-secondary" onClick={handleArchive}>
							<ArchiveIcon className="h-4 w-4" />
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

const EmptyState = () => {
	return (
		<div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 w-full md:w-2/3 lg:w-full">
			<div className="flex flex-row items-center justify-between gap-1">
				<div className="flex flex-row items-center gap-1">
					<SparklesIcon className="h-4 w-4 text-accent" />
					<h4 className="text-sm font-medium text-secondary">Cloudy's Suggestions</h4>
				</div>
			</div>
			<div className="no-scrollbar flex max-h-[28rem] flex-col gap-2 overflow-y-auto scroll-smooth p-1">
				<div className="text-tertiary text-sm">{emptyStateMessage}</div>
			</div>
		</div>
	);
};
