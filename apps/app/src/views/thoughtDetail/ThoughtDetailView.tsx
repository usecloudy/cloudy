import { ThoughtSignals } from "@cloudy/utils/common";
import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate, useParams } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { useLocalStorage, useMount, usePrevious, useUnmount, useUpdateEffect } from "react-use";

import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { useUserRecord } from "src/stores/user";
import { cn } from "src/utils";
import { ellipsizeText, makeHeadTitle } from "src/utils/strings";
import { useSave } from "src/utils/useSave";
import { useTitleStore } from "src/views/thoughtDetail/titleStore";

import { AiEditorMenu } from "./AiEditorMenu";
import { CollectionCarousel } from "./CollectionCarousel";
import { CommentColumn } from "./CommentColumn";
import { ControlColumn } from "./ControlColumn";
import { ControlRow } from "./ControlRow";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { FooterRow } from "./FooterRow";
import { createFileHandlerExtension } from "./fileHandlerExtension";
import { ThoughtEditPayload, useEditThought, useThought, useThoughtChannelListeners } from "./hooks";
import { updateMentionNodeNames } from "./mention";
import { ThoughtContext } from "./thoughtContext";
import { useThoughtStore } from "./thoughtStore";
import { clearAllApplyMarks, clearAllEditMarks, tiptapExtensions, wrapSelectionAroundWords } from "./tiptap";
import { useYProvider } from "./yProvider";

type Thought = NonNullable<ReturnType<typeof useThought>["data"]>;

export const ThoughtDetailView = () => {
	const { thoughtId } = useParams<{ thoughtId: string }>();

	return <ThoughtDetailInner key={thoughtId} thoughtId={thoughtId} />;
};

const ThoughtDetailInner = ({ thoughtId }: { thoughtId?: string }) => {
	const { data: thought, isLoading } = useThought(thoughtId);

	const previousThought = usePrevious(thought);

	const title = useTitleStore(s => s.title);

	const headTitle = title ? makeHeadTitle(ellipsizeText(title, 16)) : makeHeadTitle("New Thought");

	if ((!thought && previousThought) || (!isLoading && !thought)) {
		console.log("im going back", thought, previousThought, isLoading, thought);
		return <Navigate to="/" />;
	}

	return (
		<EditorErrorBoundary>
			<MainLayout className="no-scrollbar relative flex h-full w-screen flex-col overflow-hidden px-0 md:w-full md:px-0 lg:px-0">
				<Helmet>
					<title>{headTitle}</title>
				</Helmet>
				{thought && <ThoughtContent key={thoughtId} thoughtId={thoughtId!} thought={thought} />}
			</MainLayout>
		</EditorErrorBoundary>
	);
};

const ThoughtContent = ({ thoughtId, thought }: { thoughtId: string; thought: Thought }) => {
	useThoughtChannelListeners(thoughtId);
	const userRecord = useUserRecord();

	const { mutateAsync: editThought } = useEditThought(thoughtId);

	const [hideControlColumn, setHideControlColumn] = useLocalStorage("hideControlColumn", false);

	const [isAiWriting, setIsAiWriting] = useState(false);
	const [isEditingDisabled, setIsEditingDisabled] = useState(false);
	const [previewingKey, setPreviewingKey] = useState<string | null>(null);
	const [isShowingAiEditorMenu, setShowAiEditorMenu] = useState(false);

	const { onChange } = useSave(editThought, { debounceDurationMs: thoughtId ? 500 : 0 });

	const disableUpdatesRef = useRef(false);
	const storedContentRef = useRef<string | null>(null);

	const { setIsAiSuggestionLoading } = useThoughtStore();

	const { isConnected, ydoc, provider } = useYProvider(thoughtId!, disableUpdatesRef);

	const editor = useEditor({
		extensions: [
			...tiptapExtensions,
			createFileHandlerExtension(thoughtId),
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
						"Mod-k": () => {
							showAiEditor();
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
			onUpdate(true);
		},
		autofocus: !thoughtId,
		editable: !isEditingDisabled,
	});

	useEffect(() => {
		if (isConnected && thought.content && !editor?.getText()) {
			editor?.commands.setContent(thought.content);
		}

		if (editor) {
			updateMentionNodeNames(editor);
		}
	}, [isConnected]);

	const onUpdate = useCallback(
		(isUserUpdate: boolean) => {
			if (isConnected && !disableUpdatesRef.current) {
				const content = editor?.getHTML();
				const contentMd = editor?.storage.markdown.getMarkdown();
				const contentPlainText = editor?.getText();
				const ts = new Date();
				onChange({ content, contentMd, contentPlainText, ts });
			}
		},
		[isConnected, editor, onChange, disableUpdatesRef],
	);

	const storeContentIfNeeded = useCallback(() => {
		if (!storedContentRef.current) {
			storedContentRef.current = editor?.getHTML() ?? null;
		}
	}, [editor]);

	const restoreFromLastContent = useCallback(() => {
		if (storedContentRef.current) {
			editor?.commands.setContent(storedContentRef.current);
			storedContentRef.current = null;
		}
	}, [editor]);

	const clearStoredContent = useCallback(() => {
		storedContentRef.current = null;
	}, []);

	const showAiEditor = useCallback(() => {
		if (!editor) return;
		disableUpdatesRef.current = true;
		const selection = wrapSelectionAroundWords(editor);
		editor.chain().setTextSelection(selection).setMark("editHighlight").run();
		setShowAiEditorMenu(true);
	}, [editor]);

	const onStartAiEdits = useCallback(() => {
		if (!editor) return;
		setIsAiWriting(true);
	}, [editor, setIsAiWriting]);

	const onFinishAiEdits = useCallback(() => {
		if (!editor) return;
		setIsAiWriting(false);
	}, [editor, setIsAiWriting]);

	const applySuggestedChanges = useCallback(() => {
		if (!editor) {
			return;
		}

		clearAllApplyMarks(editor);
		setPreviewingKey(null);
		setIsEditingDisabled(false);
		clearStoredContent();
		onFinishAiEdits();
		disableUpdatesRef.current = false;
		onUpdate(false);
	}, [editor, clearStoredContent, onFinishAiEdits, onUpdate]);

	const hideAiEditor = useCallback(() => {
		if (!editor) return;

		setShowAiEditorMenu(false);
		restoreFromLastContent();
		clearStoredContent();
		clearAllEditMarks(editor);
		onFinishAiEdits();
		disableUpdatesRef.current = false;
	}, [editor, restoreFromLastContent, clearStoredContent, onFinishAiEdits]);

	useEffect(() => {
		const signals = (thought?.signals as string[] | null) ?? [];
		if (signals.includes(ThoughtSignals.AI_SUGGESTIONS)) {
			setIsAiSuggestionLoading(true);
		} else {
			setIsAiSuggestionLoading(false);
		}
	}, [setIsAiSuggestionLoading, thought?.signals]);

	return (
		<ThoughtContext.Provider
			value={{
				thoughtId,
				editor,
				disableUpdatesRef,
				onUpdate,
				isConnected,
				isEditingDisabled,
				setIsEditingDisabled,
				previewingKey,
				setPreviewingKey,
				storeContentIfNeeded,
				restoreFromLastContent,
				clearStoredContent,
				hideControlColumn,
				setHideControlColumn,
				setShowAiEditorMenu,
				isShowingAiEditorMenu,
				showAiEditor,
				hideAiEditor,
				applySuggestedChanges,
				isAiWriting,
				setIsAiWriting,
				onStartAiEdits,
				onFinishAiEdits,
			}}>
			<div className="no-scrollbar relative flex w-full flex-grow flex-col overflow-hidden lg:flex-row">
				<EditorView
					thoughtId={thoughtId!}
					remoteTitle={thought?.title ?? undefined}
					latestRemoteTitleTs={thought?.title_ts ?? undefined}
					onChange={onChange}
				/>
				<ControlColumn thoughtId={thoughtId} />
			</div>
		</ThoughtContext.Provider>
	);
};

const EditorView = ({
	thoughtId,
	remoteTitle,
	latestRemoteTitleTs,
	onChange,
}: {
	thoughtId: string;
	remoteTitle?: string;
	latestRemoteTitleTs?: string;
	onChange: (payload: ThoughtEditPayload) => void;
}) => {
	const { editor, disableUpdatesRef, isConnected, hideControlColumn, isAiWriting } = useContext(ThoughtContext);
	const { lastLocalThoughtTitleTs, setCurrentContent, setLastLocalThoughtContentTs, setLastLocalThoughtTitleTs } =
		useThoughtStore();
	const { title, setTitle, saveTitleKey } = useTitleStore();

	useMount(() => {
		setTitle(remoteTitle ?? "");
	});

	useUnmount(() => {
		setTitle("");
	});

	useUpdateEffect(() => {
		// If the remote title has changed, update the local title
		if (
			(latestRemoteTitleTs && lastLocalThoughtTitleTs && new Date(latestRemoteTitleTs) > lastLocalThoughtTitleTs) ||
			!lastLocalThoughtTitleTs
		) {
			setTitle(remoteTitle ?? "");
		}
	}, [latestRemoteTitleTs]);

	useUnmount(() => {
		setCurrentContent(null);
		setLastLocalThoughtContentTs(null);
	});

	useUpdateEffect(() => {
		const ts = new Date();
		onChange({ title, ts });
		setLastLocalThoughtTitleTs(ts);
	}, [saveTitleKey]);

	const handleChangeTitle = (title: string) => {
		const ts = new Date();
		setTitle(title);
		onChange({ title, ts });
		setLastLocalThoughtTitleTs(ts);
	};

	return (
		<div className="no-scrollbar relative box-border flex flex-grow flex-col items-center overflow-x-hidden overflow-y-scroll">
			<nav className="sticky top-[-1px] z-30 -mr-2 w-full bg-background px-6 py-2 md:top-0 md:py-3">
				<ControlRow thoughtId={thoughtId} editor={editor} />
			</nav>
			<div
				className={cn(
					"-ml-8 box-border flex w-full max-w-screen-lg grow flex-col px-3 md:pl-16 md:pt-16 lg:flex-1",
					hideControlColumn ? "lg:pr-16" : "lg:pr-4",
				)}>
				<div className="ml-8 flex flex-col gap-3 pb-4">
					<TextareaAutosize
						className="no-scrollbar w-full resize-none appearance-none border-none bg-transparent text-2xl font-bold leading-8 outline-none md:text-3xl md:leading-10"
						contentEditable={true}
						placeholder="Untitled"
						value={title ?? ""}
						onChange={e => {
							handleChangeTitle(e.target.value);
						}}
						suppressContentEditableWarning
					/>
					<div className="pr-4">
						<CollectionCarousel />
					</div>
				</div>
				<div
					// On larger screens, we need left padding to avoid some characters being cut off
					className="flex flex-row md:pl-[2px]">
					{editor && thoughtId && <EditorBubbleMenu />}
					{editor && thoughtId && (
						<div>
							<DragHandle editor={editor} tippyOptions={{ offset: [-4, 4], zIndex: 10 }}>
								<div className="hidden cursor-grab flex-row items-center rounded border border-transparent px-0.5 py-1 hover:border-border hover:bg-card active:cursor-grabbing active:bg-accent/20 md:flex">
									<GripVertical className="h-5 w-5 text-tertiary" />
								</div>
							</DragHandle>
						</div>
					)}
					{isConnected ? (
						<EditorContent
							editor={editor}
							className={cn("w-full", isAiWriting && "pointer-events-none opacity-70")}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<LoadingSpinner size="sm" />
						</div>
					)}
					<CommentColumn editor={editor} thoughtId={thoughtId} disableUpdatesRef={disableUpdatesRef} />
				</div>
				<div className="h-[75dvh]" />
			</div>
			<FooterRow />
			{editor && <AiEditorMenu />}
		</div>
	);
};
