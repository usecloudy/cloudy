import { ThoughtSignals } from "@cloudy/utils/common";
import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { NodeType } from "@tiptap/pm/model";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { useLocalStorage, useMount, useUnmount, useUpdateEffect } from "react-use";

import LoadingSpinner from "src/components/LoadingSpinner";
import { MainLayout } from "src/components/MainLayout";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useUserRecord } from "src/stores/user";
import { cn } from "src/utils";
import { ellipsizeText, makeHeadTitle } from "src/utils/strings";
import { useSave } from "src/utils/useSave";
import { useTitleStore } from "src/views/thoughtDetail/titleStore";

import { CollectionCarousel } from "./CollectionCarousel";
import { CommentColumn } from "./CommentColumn";
import { ControlColumn } from "./ControlColumn";
import { ControlRow } from "./ControlRow";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { ThoughtEditPayload, useEditThought, useThought, useThoughtChannelListeners } from "./hooks";
import { updateMentionNodeNames } from "./mention";
import { ThoughtContext } from "./thoughtContext";
import { useThoughtStore } from "./thoughtStore";
import { tiptapExtensions } from "./tiptap";
import { useYProvider } from "./yProvider";

type Thought = NonNullable<ReturnType<typeof useThought>["data"]>;
type Collection = NonNullable<Thought["collections"]>[0];

export const ThoughtDetailView = () => {
	const { thoughtId } = useParams<{ thoughtId: string }>();

	const { data: thought } = useThought(thoughtId);

	const title = useTitleStore(s => s.title);

	const headTitle = title ? makeHeadTitle(ellipsizeText(title, 16)) : makeHeadTitle("New Thought");

	return (
		<EditorErrorBoundary>
			<MainLayout className="items-center px-0 md:overflow-hidden md:px-0 lg:px-0">
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

	const [isEditingDisabled, setIsEditingDisabled] = useState(false);
	const [previewingKey, setPreviewingKey] = useState<string | null>(null);

	const { onChange } = useSave(editThought, { debounceDurationMs: thoughtId ? 500 : 0 });

	const disableUpdatesRef = useRef(false);
	const storedContentRef = useRef<string | null>(null);

	const { setIsAiSuggestionLoading } = useThoughtStore();

	const { isConnected, ydoc, provider } = useYProvider(thoughtId!, disableUpdatesRef);

	const editor = useEditor({
		extensions: [
			...tiptapExtensions,
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
			}}>
			<div className="relative flex h-full w-full flex-col lg:flex-row xl:max-w-screen-2xl">
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
	const { editor, disableUpdatesRef, isConnected, hideControlColumn } = useContext(ThoughtContext);
	const {
		isAiWriting,
		lastLocalThoughtTitleTs,
		setCurrentContent,
		setLastLocalThoughtContentTs,
		setLastLocalThoughtTitleTs,
	} = useThoughtStore();
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
		<div className="no-scrollbar relative flex h-full flex-col overflow-y-scroll lg:flex-1">
			<nav className="sticky top-0 z-30 -mr-2 bg-background py-2 md:ml-8 md:mr-4">
				<ControlRow thoughtId={thoughtId} editor={editor} />
			</nav>
			<div
				className={cn(
					"-ml-8 box-border flex flex-col px-6 pt-16 md:pl-16 lg:flex-1",
					hideControlColumn ? "md:pr-16" : "md:pr-4",
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
			</div>
		</div>
	);
};
