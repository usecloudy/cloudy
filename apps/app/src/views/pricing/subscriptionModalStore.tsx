import { create } from "zustand";

interface SubscriptionModalStore {
	isOpen: boolean;
	allowClose: boolean;
	setIsOpen: (isOpen: boolean, allowClose: boolean) => void;
}

export const useSubscriptionModalStore = create<SubscriptionModalStore>(set => ({
	isOpen: false,
	allowClose: false,
	setIsOpen: (isOpen: boolean, allowClose: boolean) => set({ isOpen, allowClose }),
}));
