import { ThoughtSignals } from "@cloudy/utils/common";
import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { EditorContent, useEditor } from "@tiptap/react";
import { diffLines } from "diff";
import { GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useParams } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { useMount, useUnmount, useUpdateEffect } from "react-use";

import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useHighlightStore } from "src/stores/highlight";
import { useUserRecord } from "src/stores/user";
import { useWorkspaceSlug } from "src/stores/workspace";
import { cn } from "src/utils";
import { ellipsizeText, makeHeadTitle } from "src/utils/strings";
import { processSearches } from "src/utils/tiptapSearchAndReplace";
import { useSave } from "src/utils/useSave";
import { useTitleStore } from "src/views/thoughtDetail/titleStore";

import { CollectionCarousel } from "./CollectionCarousel";
import { CommentColumn } from "./CommentColumn";
import { ControlColumn } from "./ControlColumn";
import { ControlRow } from "./ControlRow";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { EditorErrorBoundary } from "./EditorErrorBoundary";
import { ThoughtEditPayload, useEditThought, useThought } from "./hooks";
import { usePreviewContentStore } from "./previewContentStore";
import { useThoughtStore } from "./thoughtStore";
import { tiptapExtensions } from "./tiptap";
import { useYProvider } from "./yProvider";

type Thought = NonNullable<ReturnType<typeof useThought>["data"]>;
type Collection = NonNullable<Thought["collections"]>[0];

export const ThoughtDetailView = () => {
	const { thoughtId } = useParams<{ thoughtId: string }>();

	const wsSlug = useWorkspaceSlug();

	const { data: thought, isLoading } = useThought(thoughtId);
	const { mutateAsync: editThought } = useEditThought(thoughtId);

	const setIsAiSuggestionLoading = useThoughtStore(s => s.setIsAiSuggestionLoading);
	const title = useTitleStore(s => s.title);

	const { onChange } = useSave(editThought, { debounceDurationMs: thoughtId ? 500 : 0 });

	useEffect(() => {
		const signals = (thought?.signals as string[] | null) ?? [];
		if (signals.includes(ThoughtSignals.AI_SUGGESTIONS)) {
			setIsAiSuggestionLoading(true);
		} else {
			setIsAiSuggestionLoading(false);
		}
	}, [setIsAiSuggestionLoading, thought?.signals]);

	const headTitle = title ? makeHeadTitle(ellipsizeText(title, 16)) : makeHeadTitle("New Thought");

	return (
		<EditorErrorBoundary>
			<SimpleLayout className="lg:overflow-hidden items-center px-0">
				<Helmet>
					<title>{headTitle}</title>
				</Helmet>
				<div className="flex w-full flex-col lg:flex-row lg:h-full xl:max-w-screen-2xl">
					<EditorView
						thoughtId={thoughtId!}
						collections={thought?.collections ?? []}
						remoteContent={thought?.content ?? undefined}
						remoteTitle={thought?.title ?? undefined}
						latestRemoteTitleTs={thought?.title_ts ?? undefined}
						onChange={onChange}
					/>
					<ControlColumn thoughtId={thoughtId} />
				</div>
			</SimpleLayout>
		</EditorErrorBoundary>
	);
};

const EditorView = ({
	thoughtId,
	remoteContent,
	remoteTitle,
	latestRemoteTitleTs,
	collections,
	onChange,
}: {
	thoughtId: string;
	remoteContent?: string;
	remoteTitle?: string;
	latestRemoteTitleTs?: string;
	collections: Collection[];
	onChange: (payload: ThoughtEditPayload) => void;
}) => {
	const userRecord = useUserRecord();
	const { highlights } = useHighlightStore();
	const { lastLocalThoughtTitleTs, setCurrentContent, setLastLocalThoughtContentTs, setLastLocalThoughtTitleTs } =
		useThoughtStore();
	const { title, setTitle, saveTitleKey } = useTitleStore();
	const [isAiWriting, setIsAiWriting] = useState(false);

	const disableUpdatesRef = useRef(false);

	const { isConnected, ydoc, provider } = useYProvider(thoughtId, disableUpdatesRef);

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
		content: remoteContent,
		onUpdate: async () => {
			onUpdate(true);
		},
		autofocus: !thoughtId,
		editable: !isAiWriting,
	});

	const onUpdate = (isUserUpdate: boolean) => {
		if (isConnected && !disableUpdatesRef.current) {
			const content = editor?.getHTML();
			const contentMd = editor?.storage.markdown.getMarkdown();
			const contentPlainText = editor?.getText();
			const ts = new Date();
			onChange({ content, contentMd, contentPlainText, ts });
			setLastLocalThoughtContentTs(ts);
			setCurrentContent(content ?? "");

			console.log("onUpdate", content);
		}
	};

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

	// useUpdateEffect(() => {
	// 	if (previewContent) {
	// 		existingContent.current = editor?.getHTML() ?? "";
	// 		disableUpdatesRef.current = true;

	// 		const existingContentText = editor?.getText() ?? "";

	// 		editor?.commands.setContent(previewContent);

	// 		const newContentText = editor?.getText() ?? "";
	// 		const diff = diffLines(existingContentText, newContentText);

	// 		const addedLines = diff.filter(part => part.added);
	// 		addedLines.forEach(part => {
	// 			if (editor) {
	// 				const lines = part.value.split("\n").filter(line => line.trim().length > 0);
	// 				lines.forEach(line => {
	// 					const results = processSearches(editor.state.doc, line);

	// 					const firstResult = results?.at(0);

	// 					if (firstResult) {
	// 						editor.commands.setTextSelection(firstResult);
	// 						editor.commands.setMark("additionHighlight");
	// 					}
	// 				});
	// 			}
	// 		});
	// 	} else {
	// 		editor?.commands.unsetMark("additionHighlight");
	// 		editor?.commands.setContent(existingContent.current);
	// 		disableUpdatesRef.current = false;
	// 	}
	// }, [previewContent]);

	// useUpdateEffect(() => {
	// 	disableUpdatesRef.current = false;
	// 	editor?.commands.unsetMark("additionHighlight");
	// 	existingContent.current = editor?.getHTML() ?? "";
	// 	editor?.commands.setContent(existingContent.current);
	// 	setPreviewContent(null);
	// 	onUpdate(false);
	// }, [applyKey]);

	// Update this effect to use the new CommentHighlight mark
	useEffect(() => {
		if (editor) {
			if (highlights.length > 0) {
				disableUpdatesRef.current = true;
				const existingSelection = editor.state.selection;

				// Clear all existing comment highlights first
				editor.commands.setTextSelection({
					from: 0,
					to: editor.state.doc.content.size,
				});
				editor.commands.unsetMark("commentHighlight");

				highlights.forEach(highlight => {
					const results = processSearches(editor.state.doc, highlight.text);

					const firstResult = results?.at(0);

					if (firstResult) {
						editor.commands.setTextSelection(firstResult);
						editor.commands.setMark("commentHighlight");
					}
				});

				// Clear the selection after applying highlights
				editor.commands.setTextSelection({
					from: existingSelection.from,
					to: existingSelection.to,
				});
			} else {
				// Clear all comment highlight marks
				const existingSelection = editor.state.selection;
				editor.commands.setTextSelection({
					from: 0,
					to: editor.state.doc.content.size,
				});
				editor.commands.unsetMark("commentHighlight");
				editor.commands.setTextSelection({
					from: existingSelection.from,
					to: existingSelection.to,
				});

				disableUpdatesRef.current = false;
			}
		}
	}, [editor, highlights]);

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

	const handleSetDisableUpdates = (shouldDisable: boolean) => {
		disableUpdatesRef.current = shouldDisable;
	};

	return (
		<div className="flex flex-col lg:flex-1 pt-8 lg:py-8 box-border lg:overflow-y-scroll no-scrollbar -ml-8 px-6 md:px-0">
			<div className="sticky lg:relative top-[-1px] z-30 py-1 bg-background ml-8 -mr-2 md:mr-4 md:mt-3">
				<ControlRow thoughtId={thoughtId} editor={editor} />
			</div>
			<div className="flex flex-col gap-3 pb-4 ml-8">
				<TextareaAutosize
					className="w-full resize-none appearance-none border-none bg-transparent text-2xl leading-8 md:text-3xl font-bold md:leading-10 outline-none no-scrollbar"
					contentEditable={true}
					placeholder="Untitled"
					value={title ?? ""}
					onChange={e => {
						handleChangeTitle(e.target.value);
					}}
					suppressContentEditableWarning
				/>
				<div className="pr-4">
					<CollectionCarousel thoughtId={thoughtId} collections={collections} />
				</div>
			</div>
			<div
				// On larger screens, we need left padding to avoid some characters being cut off
				className="flex flex-row md:pl-[2px]">
				{editor && thoughtId && (
					<EditorBubbleMenu
						thoughtId={thoughtId}
						editor={editor}
						setDisableUpdates={handleSetDisableUpdates}
						onUpdate={onUpdate}
						setIsAiWriting={setIsAiWriting}
					/>
				)}
				{editor && thoughtId && (
					<div>
						<DragHandle editor={editor} tippyOptions={{ offset: [-4, 4], zIndex: 10 }}>
							<div className="hidden md:flex flex-row items-center hover:bg-card border border-transparent hover:border-border rounded py-1 px-0.5 active:bg-accent/20 cursor-grab active:cursor-grabbing">
								<GripVertical className="h-5 w-5 text-tertiary" />
							</div>
						</DragHandle>
					</div>
				)}
				{isConnected ? (
					<EditorContent editor={editor} className={cn("w-full", isAiWriting && "pointer-events-none opacity-70")} />
				) : (
					<div className="w-full h-full flex items-center justify-center">
						<LoadingSpinner size="sm" />
					</div>
				)}
				<CommentColumn editor={editor} thoughtId={thoughtId} disableUpdatesRef={disableUpdatesRef} />
			</div>
		</div>
	);
};
