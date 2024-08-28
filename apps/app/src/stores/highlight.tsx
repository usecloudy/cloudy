import { create } from "zustand";

export interface Highlight {
	text: string;
}

export interface HighlightStore {
	highlights: Highlight[];
	setHighlights: (highlights: Highlight[]) => void;
}

export const useHighlightStore = create<HighlightStore>(set => ({
	highlights: [],
	setHighlights: highlights => set({ highlights }),
}));
