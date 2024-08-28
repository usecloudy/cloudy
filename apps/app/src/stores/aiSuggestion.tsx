import { create } from "zustand";

export const useAiSuggestionStore = create<{
	isLoading: boolean;
	setIsLoading: (isLoading: boolean) => void;
}>(set => ({
	isLoading: false,
	setIsLoading: (isLoading: boolean) => set({ isLoading }),
}));
