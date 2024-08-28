import Store from "electron-store";
import { StateStorage } from "zustand/middleware";

const electronStore = new Store();

const zustandElectronStore: StateStorage = {
	getItem: (name: string): string | null => {
		const value = electronStore.get(name);
		return value ? JSON.stringify(value) : null;
	},
	setItem: (name: string, value: string): void => {
		electronStore.set(name, JSON.parse(value));
	},
	removeItem: (name: string): void => {
		electronStore.delete(name);
	},
};

export default zustandElectronStore;
