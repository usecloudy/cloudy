import { create } from "zustand";

interface ThreadStore {
	activeThreadCommentId: string | null;
	setActiveThreadCommentId: (id: string | null) => void;
}

export const useThreadStore = create<ThreadStore>(set => ({
	activeThreadCommentId: null,
	setActiveThreadCommentId: (id: string | null) => set({ activeThreadCommentId: id }),
}));
