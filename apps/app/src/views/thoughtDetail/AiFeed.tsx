import { Database } from "@repo/db";
import { useMutation, useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useMount, useUnmount } from "react-use";
import { create } from "zustand";

import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useAiSuggestionStore } from "src/stores/aiSuggestion";
import { useHighlightStore } from "src/stores/highlight";
import { cn } from "src/utils";
import { makeHumanizedTime } from "src/utils/strings";

import { useThought } from "./hooks";
import { useThreadStore } from "./threadStore";
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
const useIdeaSuggestions = (thoughtId: string) => {
	useEffect(() => {
		const channel = supabase
			.channel("ideaSuggestions")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thought_chats",
					filter: `thought_id=eq.${thoughtId}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["ideaSuggestions", thoughtId],
					});
				},
			)
			.subscribe();

		return () => {
			channel.unsubscribe();
		};
	}, [thoughtId]);

	const useQueryResult = useQuery({
		queryKey: ["ideaSuggestions", thoughtId],
		queryFn: async () => {
			if (thoughtId === "new") return [];

			const { data, error } = await supabase
				.from("thought_chats")
				.select("*, thought_chat_threads(count)")
				.eq("thought_id", thoughtId);

			if (error) throw error;

			const suggestions = data.map(item => ({
				...item,
				threadCount: item.thought_chat_threads[0].count,
			}));

			return suggestions.sort((a, b) => {
				if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
				if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
				if (a.type === "title_suggestion" && b.type !== "title_suggestion") return -1;
				if (a.type !== "title_suggestion" && b.type === "title_suggestion") return 1;
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});
		},
		initialData: [],
	});

	return useQueryResult;
};

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

const useArchiveAllExceptPinned = (thoughtId: string) => {
	return useMutation({
		mutationFn: async () => {
			const { error } = await supabase
				.from("thought_chats")
				.update({ is_archived: true })
				.not("is_pinned", "eq", true)
				.eq("thought_id", thoughtId);
			if (error) throw error;
		},
		onMutate: () => {
			queryClient.setQueryData(["ideaSuggestions", thoughtId], (data: Suggestion[] | undefined) =>
				data?.filter(suggestion => suggestion.is_pinned),
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

// Helper functions
const IconForType = ({ type }: { type: string }) => {
	const iconMap: { [key: string]: JSX.Element } = {
		suggestion: <LightbulbIcon className="text-tertiary ml-[-0.15rem] h-3.5 w-3.5" />,
		comment: <MessageCircleIcon className="text-tertiary h-3.5 w-3.5" />,
		question: <MessageCircleQuestionIcon className="text-tertiary h-3.5 w-3.5" />,
		title_suggestion: <PencilIcon className="text-tertiary h-3 w-3" />,
	};
	return iconMap[type] || <MessageCircleIcon className="text-tertiary h-3.5 w-3.5" />;
};

const titleForType = (type: string) => {
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

export const AiFeed = ({
	thoughtId,
	isViewingArchive,
	setIsViewingArchive,
}: {
	thoughtId?: string;
	isViewingArchive: boolean;
	setIsViewingArchive: (isViewingArchive: boolean) => void;
}) => {
	if (!thoughtId) return <EmptyState />;

	return <AiFeedInner thoughtId={thoughtId} isViewingArchive={isViewingArchive} setIsViewingArchive={setIsViewingArchive} />;
};

// Main component
export const AiFeedInner = ({
	thoughtId,
	isViewingArchive,
	setIsViewingArchive,
}: {
	thoughtId: string;
	isViewingArchive: boolean;
	setIsViewingArchive: (isViewingArchive: boolean) => void;
}) => {
	const { data: ideaSuggestions } = useIdeaSuggestions(thoughtId);
	const isSuggestionPaused = useThoughtSuggestionIsPaused(thoughtId);

	const { mutate: markAllAsRead } = useMarkAllAsRead(thoughtId);
	const { mutate: archiveAllExceptPinned } = useArchiveAllExceptPinned(thoughtId);
	const { mutate: setSuggestionPaused } = useSetSuggestionPaused(thoughtId);
	const { mutate: deleteAllArchived } = useDeleteAllArchived(thoughtId);

	const { isLoading: isAiSuggestionLoading } = useAiSuggestionStore();

	const isUnseenCount = ideaSuggestions.filter(suggestion => !suggestion.is_seen && !suggestion.is_archived).length ?? 0;

	const suggestions = useMemo(() => {
		return isViewingArchive
			? ideaSuggestions.filter(suggestion => suggestion.is_archived)
			: ideaSuggestions.filter(suggestion => !suggestion.is_archived);
	}, [isViewingArchive, ideaSuggestions]);

	return (
		<div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4 w-full md:w-2/3 lg:w-full">
			{isViewingArchive ? (
				<div className="flex flex-row items-center justify-between gap-1">
					<div className="flex flex-row items-center gap-1">
						<Button
							size="icon-xs"
							variant="ghost"
							className="text-secondary"
							onClick={() => setIsViewingArchive(false)}>
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
							onClick={() => setIsViewingArchive(true)}>
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
								<DropdownItem onSelect={() => archiveAllExceptPinned()}>
									<TrashIcon className="h-4 w-4" />
									<span>Archive all (Except pinned)</span>
								</DropdownItem>
							</Dropdown>
						</div>
					</div>
				</div>
			)}
			<IdeaSuggestionList thoughtId={thoughtId} suggestions={suggestions} />
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
	const { setActiveThreadCommentId } = useThreadStore();

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

	const handleMouseLeave = () => setHighlights([]);

	const handleApplyTitle = () => {
		setTitle(suggestion.content!, true);
		deleteComment(suggestion.id);
	};

	const handleReply = () => {
		setActiveThreadCommentId(suggestion.id);
	};

	const handlePin = () => {
		pinComment({
			commentId: suggestion.id,
			isPinned: !suggestion.is_pinned,
		});
	};

	const handleArchive = () => {
		archiveComment(suggestion.id);
	};

	const handleUnarchive = () => {
		unarchiveComment(suggestion.id);
	};

	const handleDelete = () => {
		deleteComment(suggestion.id);
	};

	const handleGenerate = () => {
		handleReply();
		generateSuggestion(suggestion.id);
	};

	return (
		<div
			key={suggestion.id}
			className={`flex flex-col gap-2 rounded bg-background p-3 text-sm outline-offset-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards hover:outline hover:outline-accent/40 ${index > 0 ? "delay-" + index * 100 : ""}`}
			onMouseEnter={() => handleMouseEnter(suggestion)}
			onMouseLeave={handleMouseLeave}>
			<div className="flex w-full flex-row items-center justify-between gap-2 text-xs text-secondary">
				<div className="flex flex-row items-center gap-1 font-medium">
					<IconForType type={suggestion.type} />
					{titleForType(suggestion.type)}
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
					{suggestion.type !== "title_suggestion" && (
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
