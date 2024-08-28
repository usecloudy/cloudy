import { create } from "zustand";

interface TitleStore {
	title: string;
	saveTitleKey: number;
	setTitle: (title: string, saveTitle?: boolean) => void;
}

export const useTitleStore = create<TitleStore>((set, get) => ({
	title: "",
	saveTitleKey: 0,
	setTitle: (title: string, saveTitle?: boolean) =>
		set({ title, saveTitleKey: saveTitle ? get().saveTitleKey + 1 : get().saveTitleKey }),
}));
