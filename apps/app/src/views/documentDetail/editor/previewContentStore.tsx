import { create } from "zustand";

interface PreviewContentStore {
	previewContent: string | null;
	setPreviewContent: (content: string | null) => void;
	applyKey: number;
	apply: () => void;
}

export const usePreviewContentStore = create<PreviewContentStore>(set => ({
	previewContent: null,
	setPreviewContent: content => set({ previewContent: content }),
	applyKey: 0,
	apply: () => set(state => ({ applyKey: state.applyKey + 1 })),
}));
