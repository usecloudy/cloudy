import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { EditorContent, Extension, JSONContent, useEditor } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAsync } from "react-use";

import { useUserRecord } from "src/stores/user";
import { cn } from "src/utils";
import { useSave } from "src/utils/useSave";
import { useSidebarContext } from "src/views/navigation/SidebarProvider";

import { useDocumentContext } from "../DocumentContext";
import { DocumentLoadingPlaceholder } from "../DocumentLoadingPlaceholder";
import { NavBar } from "../navBar/NavBar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { FooterRow } from "./FooterRow";
import { TitleArea } from "./TitleArea";
import { ChatSectionView } from "./chatSection/ChatSectionView";
import { createFileHandlerExtension } from "./fileHandlerExtension";
import { useDefaultThreadId, useEditDocument, useGenerateDocument, useThought } from "./hooks";
import { updateMentionNodeNames } from "./mention";
import { AiGenerationContext, ThoughtContext } from "./thoughtContext";
import { clearAllApplyMarks, clearAllEditMarks, tiptapExtensions, wrapSelectionAroundWords } from "./tiptap";
import { useYProvider } from "./yProvider";

type Thought = NonNullable<ReturnType<typeof useThought>["data"]>;

export const EditorView = ({ thought }: { thought: Thought }) => {
	const { documentId, isEditMode } = useDocumentContext();

	const userRecord = useUserRecord();

	const { mutateAsync: editThought } = useEditDocument(documentId);

	const [title, setTitle] = useState(thought.title ?? "");
	const [localTitleTs, setLocalTitleTs] = useState<Date>(new Date());

	const [isAiWriting, setIsAiWriting] = useState(false);
	const [isEditingDisabled, setIsEditingDisabled] = useState(false);
	const [previewingKey, setPreviewingKey] = useState<string | null>(null);
	const [isShowingAiEditorMenu, setShowAiEditorMenu] = useState(false);
	const [isShowingAiSelectionMenu, setIsShowingAiSelectionMenu] = useState(false);
	const [threadId, setThreadId] = useState<string | null>(null);

	const { onChange } = useSave(editThought, { debounceDurationMs: documentId ? 500 : 0 });

	const disableUpdatesRef = useRef(false);
	const storedContentRef = useRef<JSONContent | null>(null);
	const contentAfterApplyRef = useRef<JSONContent | null>(null);

	const { setIsSidebarCollapsed } = useSidebarContext({ isFixed: isShowingAiEditorMenu });

	const { isLoading, isConnected, ydoc, provider } = useYProvider(documentId!, disableUpdatesRef);

	const editor = useEditor({
		editorProps: {
			attributes: { class: "main-editor doc-editor" },
		},
		extensions: [
			...tiptapExtensions,
			createFileHandlerExtension(documentId),
			Collaboration.configure({
				document: ydoc,
			}),
			CollaborationCursor.configure({
				provider,
				user: {
					name: userRecord.name ?? userRecord.email,
					color: "#b694ff",
				},
			}),
			Extension.create({
				name: "hotkeys",
				addKeyboardShortcuts() {
					return {
						"Mod-o": () => {
							showAiEditor();
							return true;
						},
						"Mod-k": () => {
							showAiSelectionMenu();
							return true;
						},
						Escape: () => {
							hideAiEditor();
							return true;
						},
					};
				},
			}),
		],
		content: "",
		onUpdate: ({ transaction }) => {
			if (transaction.getMeta("y-sync$")) {
				// Ignore y-sync updates
				return;
			}
			onUpdate();
		},
		autofocus: !documentId,
		editable: isEditMode && !isEditingDisabled,
	});

	useEffect(() => {
		if (isConnected && (thought.content_json || thought.content) && !editor?.getText()) {
			editor?.commands.setContent((thought.content_json as JSONContent) ?? thought.content);
		}

		if (editor) {
			updateMentionNodeNames(editor);

			if (!isConnected) {
				// Blur on disconnect
				editor.commands.blur();
			}
		}
	}, [isConnected]);

	const onUpdate = useCallback(
		({ force = false }: { force?: boolean } = {}) => {
			if (force || (isConnected && !disableUpdatesRef.current)) {
				if (editor) {
					const contentJson = editor.getJSON();
					const contentHtml = editor.getHTML();
					const contentMd = editor.storage.markdown.getMarkdown();
					const contentPlainText = editor.getText();

					const ts = new Date();
					onChange({ contentHtml, contentJson, contentMd, contentPlainText, ts });
				}
			}
		},
		[isConnected, editor, onChange, disableUpdatesRef],
	);

	const storeContentIfNeeded = useCallback(() => {
		if (!storedContentRef.current) {
			storedContentRef.current = editor?.getJSON() ?? null;
		}
	}, [editor]);

	const storeContentAsApplyContent = useCallback(() => {
		contentAfterApplyRef.current = editor?.getJSON() ?? null;
	}, [editor]);

	const restoreFromLastContent = useCallback(() => {
		if (storedContentRef.current) {
			editor?.commands.setContent(storedContentRef.current);
			storedContentRef.current = null;
			contentAfterApplyRef.current = null;
		}
	}, [editor]);

	const clearStoredContent = useCallback(() => {
		storedContentRef.current = null;
	}, []);

	const clearApplyContent = useCallback(() => {
		contentAfterApplyRef.current = null;
	}, []);

	const convertSelectionToEditMark = useCallback(() => {
		if (!editor) return;
		const selection = wrapSelectionAroundWords(editor);
		editor.chain().setTextSelection(selection).setMark("editHighlight").run();
	}, [editor]);

	const showAiSelectionMenu = useCallback(() => {
		if (!editor) return;
		disableUpdatesRef.current = true;

		if (editor.view.state.selection.content().size > 0) {
			convertSelectionToEditMark();
			setIsShowingAiSelectionMenu(true);
		}
	}, [editor, convertSelectionToEditMark]);

	const showAiEditor = useCallback(() => {
		if (!editor) return;
		disableUpdatesRef.current = true;

		setIsSidebarCollapsed(true);
		setShowAiEditorMenu(true);
	}, [editor, setIsSidebarCollapsed]);

	const onStartAiEdits = useCallback(() => {
		if (!editor) return;
		setIsAiWriting(true);
		setIsEditingDisabled(true);
	}, [editor, setIsAiWriting]);

	const onFinishAiEdits = useCallback(() => {
		if (!editor) return;
		setIsAiWriting(false);
	}, [editor, setIsAiWriting]);

	const applySuggestedChanges = useCallback(() => {
		if (!editor) {
			return;
		}

		editor.commands.setContent(contentAfterApplyRef.current ?? "");

		clearAllApplyMarks(editor);
		setPreviewingKey(null);
		setIsEditingDisabled(false);
		clearApplyContent();
		clearStoredContent();
		onFinishAiEdits();
		disableUpdatesRef.current = false;
		onUpdate();
	}, [editor, clearStoredContent, clearApplyContent, onFinishAiEdits, onUpdate]);

	const hideAiEditor = useCallback(() => {
		if (!editor) return;

		setShowAiEditorMenu(false);
		restoreFromLastContent();
		clearApplyContent();
		clearStoredContent();
		clearAllEditMarks(editor);
		onFinishAiEdits();
		disableUpdatesRef.current = false;
	}, [editor, restoreFromLastContent, clearStoredContent, clearApplyContent, onFinishAiEdits]);

	const hideAiSelectionMenu = useCallback(() => {
		if (!editor) return;

		setIsShowingAiSelectionMenu(false);
		restoreFromLastContent();
		clearApplyContent();
		clearStoredContent();
		clearAllEditMarks(editor);
		onFinishAiEdits();
		disableUpdatesRef.current = false;
	}, [editor, restoreFromLastContent, clearStoredContent, clearApplyContent, onFinishAiEdits]);

	const handleSetTitle = useCallback(
		(title: string) => {
			const ts = new Date();
			setTitle(title);
			onChange({ title, ts });
			setLocalTitleTs(ts);
		},
		[setTitle, onChange],
	);

	useEffect(() => {
		if (thought.title_ts && new Date(thought.title_ts) > localTitleTs) {
			setTitle(thought.title ?? "");
			setLocalTitleTs(new Date(thought.title_ts));
		}
	}, [thought.title_ts, localTitleTs, setTitle, thought.title]);

	useHotkeys("mod+o", e => {
		e.preventDefault();
		e.stopPropagation();
		showAiEditor();
	});

	return (
		<ThoughtContext.Provider
			value={{
				thoughtId: documentId,
				isConnecting: isLoading,
				editor,
				disableUpdatesRef,
				onUpdate,
				isConnected,
				isEditingDisabled,
				setIsEditingDisabled,
				previewingKey,
				setPreviewingKey,
				storeContentIfNeeded,
				storeContentAsApplyContent,
				restoreFromLastContent,
				clearStoredContent,
				clearApplyContent,
				setShowAiEditorMenu,
				isShowingAiEditorMenu,
				showAiEditor,
				hideAiEditor,
				applySuggestedChanges,
				isAiWriting,
				setIsAiWriting,
				onStartAiEdits,
				onFinishAiEdits,
				threadId,
				setThreadId,
				convertSelectionToEditMark,
				isShowingAiSelectionMenu,
				hideAiSelectionMenu,
				showAiSelectionMenu,
				title,
				setTitle: handleSetTitle,
			}}>
			<div className="relative flex h-full flex-row">
				<div
					className={cn(
						"relative hidden w-[33vw] shrink-0 bg-background transition-[width] duration-300 ease-in-out md:block",
						!isShowingAiEditorMenu && "w-0",
					)}>
					{isShowingAiEditorMenu && <ChatSectionView />}
				</div>
				<div className="no-scrollbar relative flex w-full flex-grow flex-col lg:flex-row">
					<AiDocumentGeneration thought={thought}>
						<Editor />
					</AiDocumentGeneration>
				</div>
				<div
					className={cn(
						"absolute top-0 z-40 block h-full w-screen bg-background md:hidden",
						!isShowingAiEditorMenu && "hidden",
					)}>
					{isShowingAiEditorMenu && <ChatSectionView />}
				</div>
			</div>
		</ThoughtContext.Provider>
	);
};

const AiDocumentGeneration = ({ thought, children }: { thought: Thought; children: React.ReactNode }) => {
	const { onStartAiEdits, onFinishAiEdits, isAiWriting, onUpdate, showAiEditor, setThreadId } = useContext(ThoughtContext);

	const { data: defaultThreadId } = useDefaultThreadId();
	const generateDocumentMutation = useGenerateDocument();

	const hasGenerated = useRef(false);

	useAsync(async () => {
		if (!hasGenerated.current && thought.generation_prompt && !thought.generated_at && defaultThreadId) {
			hasGenerated.current = true;

			showAiEditor();
			setThreadId(defaultThreadId);

			onStartAiEdits();
			await generateDocumentMutation.mutateAsync(thought.id);
			onFinishAiEdits();

			onUpdate({ force: true });
		}
	}, [thought?.id, defaultThreadId]);

	return (
		<AiGenerationContext.Provider
			value={{ isGenerating: isAiWriting && !generateDocumentMutation.hasStarted && !thought.generated_at }}>
			{children}
		</AiGenerationContext.Provider>
	);
};

const Editor = () => {
	const { editor, isConnected, isConnecting, isAiWriting } = useContext(ThoughtContext);
	const { isGenerating } = useContext(AiGenerationContext);

	return (
		<div className="no-scrollbar relative box-border flex flex-grow flex-col items-center overflow-y-scroll">
			<nav className="sticky top-[-1px] z-30 -mr-2 w-full bg-background px-6 py-2 md:top-0 md:py-3">
				<NavBar editor={editor} />
			</nav>
			<div className="box-border flex w-full max-w-screen-lg grow flex-col px-6 md:pl-12 md:pr-20 md:pt-16 lg:flex-1">
				{isConnecting ? (
					<div className="w-full pl-8">
						<DocumentLoadingPlaceholder />
					</div>
				) : (
					<>
						<TitleArea />
						<div
							// On larger screens, we need left padding to avoid some characters being cut off
							className="relative flex flex-row md:pl-[2px]">
							{editor && <EditorBubbleMenu />}
							{editor && (
								<div>
									<DragHandle editor={editor} tippyOptions={{ offset: [-4, 4], zIndex: 10 }}>
										<div className="hidden cursor-grab flex-row items-center rounded border border-transparent px-0.5 py-1 hover:border-border hover:bg-card active:cursor-grabbing active:bg-accent/20 md:flex">
											<GripVertical className="h-5 w-5 text-tertiary" />
										</div>
									</DragHandle>
								</div>
							)}
							<EditorContent
								editor={editor}
								className={cn(
									"w-full",
									(isAiWriting || !isConnected) && "pointer-events-none opacity-70",
									isGenerating && "opacity-0",
								)}
							/>
							{isGenerating && (
								<div className="absolute left-8 top-0 animate-pulse text-tertiary">Generating...</div>
							)}
						</div>
						<div className="h-[75dvh]" />
					</>
				)}
			</div>
			<FooterRow />
		</div>
	);
};
