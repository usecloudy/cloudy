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
	isShowingAiEditorMenu?: boolean;
	isAiWriting: boolean;
	onUpdate: (payload?: { force?: boolean }) => void;
	setPreviewingKey: (previewingKey: string | null) => void;
	setIsEditingDisabled: (isEditingDisabled: boolean) => void;
	storeContentIfNeeded: () => void;
	restoreFromLastContent: () => void;
	clearStoredContent: () => void;
	setHideControlColumn: (hideControlColumn: boolean) => void;
	setShowAiEditorMenu: (isShowingAiEditorMenu: boolean) => void;
	showAiEditor: () => void;
	hideAiEditor: () => void;
	applySuggestedChanges: () => void;
	setIsAiWriting: (isAiWriting: boolean) => void;
	onStartAiEdits: () => void;
	onFinishAiEdits: () => void;
}

export const ThoughtContext = createContext<ThoughtContextType>({
	thoughtId: "",
	isConnected: false,
	editor: null,
	isEditingDisabled: false,
	previewingKey: null,
	disableUpdatesRef: { current: false },
	hideControlColumn: false,
	isShowingAiEditorMenu: false,
	isAiWriting: false,
	onUpdate: () => {},
	setIsAiWriting: () => {},
	setIsEditingDisabled: () => {},
	setPreviewingKey: () => {},
	storeContentIfNeeded: () => {},
	restoreFromLastContent: () => {},
	clearStoredContent: () => {},
	setHideControlColumn: () => {},
	setShowAiEditorMenu: () => {},
	showAiEditor: () => {},
	hideAiEditor: () => {},
	applySuggestedChanges: () => {},
	onStartAiEdits: () => {},
	onFinishAiEdits: () => {},
});

export const AiGenerationContext = createContext<{
	isGenerating: boolean;
}>({
	isGenerating: false,
});
