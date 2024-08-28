import { create } from "zustand";

interface SuggestedCollection {
	id: string;
	title: string | null;
}

interface SuggestedCollectionsStore {
	suggestedCollections: SuggestedCollection[];
	setSuggestedCollections: (collections: SuggestedCollection[]) => void;
}

export const useSuggestedCollectionsStore = create<SuggestedCollectionsStore>(set => ({
	suggestedCollections: [],
	setSuggestedCollections: collections => set({ suggestedCollections: collections }),
}));
