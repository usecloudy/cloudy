import { Editor } from "@tiptap/react";
import { createContext } from "react";

export interface ThoughtContextType {
	thoughtId: string;
	isConnected: boolean;
	isEditingDisabled: boolean;
	previewingKey: string | null;
	editor: Editor | null;
	disableUpdatesRef: React.MutableRefObject<boolean>;
	hideControlColumn?: boolean;
	onUpdate: (isUserUpdate: boolean) => void;
	setPreviewingKey: (previewingKey: string | null) => void;
	setIsEditingDisabled: (isEditingDisabled: boolean) => void;
	storeContentIfNeeded: () => void;
	restoreFromLastContent: () => void;
	clearStoredContent: () => void;
	setHideControlColumn: (hideControlColumn: boolean) => void;
}

export const ThoughtContext = createContext<ThoughtContextType>({
	thoughtId: "",
	isConnected: false,
	editor: null,
	isEditingDisabled: false,
	previewingKey: null,
	disableUpdatesRef: { current: false },
	hideControlColumn: false,
	onUpdate: () => {},
	setIsEditingDisabled: () => {},
	setPreviewingKey: () => {},
	storeContentIfNeeded: () => {},
	restoreFromLastContent: () => {},
	clearStoredContent: () => {},
	setHideControlColumn: () => {},
});
