import { Editor } from "@tiptap/react";
import { createContext } from "react";

export interface ThoughtContextType {
	thoughtId: string;
	isConnecting: boolean;
	isConnected: boolean;
	isEditingDisabled: boolean;
	previewingKey: string | null;
	editor: Editor | null;
	disableUpdatesRef: React.MutableRefObject<boolean>;
	isShowingAiEditorMenu?: boolean;
	isShowingAiSelectionMenu?: boolean;
	isAiWriting: boolean;
	threadId: string | null;
	title: string;
	setTitle: (title: string) => void;
	onUpdate: (payload?: { force?: boolean }) => void;
	setPreviewingKey: (previewingKey: string | null) => void;
	setIsEditingDisabled: (isEditingDisabled: boolean) => void;
	storeContentIfNeeded: () => void;
	restoreFromLastContent: () => void;
	clearStoredContent: () => void;
	setShowAiEditorMenu: (isShowingAiEditorMenu: boolean) => void;
	showAiEditor: () => void;
	hideAiEditor: () => void;
	applySuggestedChanges: () => void;
	setIsAiWriting: (isAiWriting: boolean) => void;
	onStartAiEdits: () => void;
	onFinishAiEdits: () => void;
	setThreadId: (threadId: string | null) => void;
	convertSelectionToEditMark: () => void;
	hideAiSelectionMenu: () => void;
	showAiSelectionMenu: () => void;
	storeContentAsApplyContent: () => void;
	clearApplyContent: () => void;
}

export const ThoughtContext = createContext<ThoughtContextType>({
	thoughtId: "",
	isConnecting: true,
	isConnected: false,
	editor: null,
	isEditingDisabled: false,
	previewingKey: null,
	disableUpdatesRef: { current: false },
	isShowingAiEditorMenu: false,
	isShowingAiSelectionMenu: false,
	isAiWriting: false,
	threadId: null,
	title: "",
	setTitle: () => {},
	onUpdate: () => {},
	setIsAiWriting: () => {},
	setIsEditingDisabled: () => {},
	setPreviewingKey: () => {},
	storeContentIfNeeded: () => {},
	restoreFromLastContent: () => {},
	clearStoredContent: () => {},
	setShowAiEditorMenu: () => {},
	showAiEditor: () => {},
	hideAiEditor: () => {},
	applySuggestedChanges: () => {},
	onStartAiEdits: () => {},
	onFinishAiEdits: () => {},
	setThreadId: () => {},
	convertSelectionToEditMark: () => {},
	hideAiSelectionMenu: () => {},
	showAiSelectionMenu: () => {},
	storeContentAsApplyContent: () => {},
	clearApplyContent: () => {},
});

export const AiGenerationContext = createContext<{
	isGenerating: boolean;
}>({
	isGenerating: false,
});
