import { Selection } from "@tiptap/pm/state";
import { create } from "zustand";

export type CommentFilter = {
	selectedGroupId: string;
	commentIds: string[];
};

export type FeedMode = "default" | "archive" | "selectedComments" | "thread";

interface ThoughtStore {
	currentContent: string | null;
	setCurrentContent: (content: string | null) => void;
	selectionToEdit: Selection | null;
	setSelectionToEdit: (selection: Selection | null) => void;
	lastLocalThoughtTitleTs: Date | null;
	setLastLocalThoughtTitleTs: (ts: Date | null) => void;
	lastLocalThoughtContentTs: Date | null;
	setLastLocalThoughtContentTs: (ts: Date | null) => void;
	isAiSuggestionLoading: boolean;
	setIsAiSuggestionLoading: (isLoading: boolean) => void;
	commentFilter: CommentFilter | null;
	setCommentFilter: (filter: CommentFilter | null) => void;
	feedMode: FeedMode;
	setFeedMode: (mode: FeedMode) => void;
	activeThreadCommentId: string | null;
	setActiveThreadCommentId: (id: string | null) => void;
	isAiWriting: boolean;
	setIsAiWriting: (isWriting: boolean) => void;
	reset: () => void;
}

export const useThoughtStore = create<ThoughtStore>(set => ({
	currentContent: null,
	setCurrentContent: content => set({ currentContent: content }),
	selectionToEdit: null,
	setSelectionToEdit: selection => set({ selectionToEdit: selection }),
	lastLocalThoughtTitleTs: null,
	setLastLocalThoughtTitleTs: ts => set({ lastLocalThoughtTitleTs: ts }),
	lastLocalThoughtContentTs: null,
	setLastLocalThoughtContentTs: ts => set({ lastLocalThoughtContentTs: ts }),
	isAiSuggestionLoading: false,
	setIsAiSuggestionLoading: isLoading => set({ isAiSuggestionLoading: isLoading }),
	commentFilter: null,
	setCommentFilter: filter =>
		set({ commentFilter: filter, feedMode: filter ? "selectedComments" : "default", activeThreadCommentId: null }),
	feedMode: "default",
	setFeedMode: mode => set({ feedMode: mode }),
	activeThreadCommentId: null,
	setActiveThreadCommentId: id =>
		set({ activeThreadCommentId: id, feedMode: id ? "thread" : "default", commentFilter: null }),
	isAiWriting: false,
	setIsAiWriting: isWriting => set({ isAiWriting: isWriting }),
	reset: () =>
		set({
			currentContent: null,
			selectionToEdit: null,
			lastLocalThoughtTitleTs: null,
			lastLocalThoughtContentTs: null,
			isAiSuggestionLoading: false,
			commentFilter: null,
			feedMode: "default",
			activeThreadCommentId: null,
			isAiWriting: false,
		}),
}));
