import { create } from "zustand";

interface SearchBarStore {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
}

export const useSearchBarStore = create<SearchBarStore>(set => ({
	isOpen: false,
	setIsOpen: isOpen => set({ isOpen }),
}));
