import { Selection } from "@tiptap/pm/state";
import { create } from "zustand";

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
}));
