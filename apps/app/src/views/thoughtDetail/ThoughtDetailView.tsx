import { ThoughtSignals } from "@cloudy/utils/common";
import DragHandle from "@tiptap-pro/extension-drag-handle-react";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import { diffLines } from "diff";
import { GripVertical } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { useMount, useUnmount, useUpdateEffect } from "react-use";
import { Awareness } from "y-protocols/awareness.js";
import { WebrtcProvider } from "y-webrtc";
import * as Y from "yjs";

import { supabase } from "src/clients/supabase";
import LoadingSpinner from "src/components/LoadingSpinner";
import { SimpleLayout } from "src/components/SimpleLayout";
import { useHighlightStore } from "src/stores/highlight";
import { useUserRecord } from "src/stores/user";
import { useWorkspaceSlug } from "src/stores/workspace";
import { cn } from "src/utils";
import { ellipsizeText, makeHeadTitle } from "src/utils/strings";
import { makeThoughtUrl } from "src/utils/thought";
import { processSearches } from "src/utils/tiptapSearchAndReplace";
import { useSave } from "src/utils/useSave";
import { SupabaseProvider } from "src/utils/yjsSyncProvider";
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

type Thought = NonNullable<ReturnType<typeof useThought>["data"]>;
type Collection = NonNullable<Thought["collections"]>[0];

export const ThoughtDetailView = () => {
	const { thoughtId } = useParams<{ thoughtId: string }>();

	const [prevThoughtId, setPreviousThoughtId] = useState<string | null>(null);

	const [isNewMode, setIsNewMode] = useState(thoughtId === "new");
	// const [key, setKey] = useState(0);
	// const { thoughtId: activeThoughtId, setThoughtId, reset } = useThoughtStore();

	// // Update isNewMode and key when thoughtId changes
	// useEffect(() => {
	// 	// Check if we're entering or staying in "new" mode
	// 	if (prevThoughtId === "new" || thoughtId === "new") {
	// 		// If we're transitioning from an existing thought to a new one
	// 		if (prevThoughtId !== "new" && thoughtId === "new") {
	// 			// Generate a new key to force a re-render
	// 			setKey(Date.now());
	// 		}
	// 		// Set the mode to "new" for creating a new thought
	// 		setIsNewMode(true);
	// 		reset();
	// 		posthog.capture("new_thought");
	// 	} else {
	// 		// We're viewing an existing thought
	// 		setIsNewMode(false);
	// 		// Generate a new key to force a re-render when switching between existing thoughts
	// 		setKey(Date.now());
	// 		reset();
	// 		posthog.capture("view_thought");
	// 	}
	// 	setThoughtId(thoughtId === "new" ? null : (thoughtId ?? null));
	// 	setPreviousThoughtId(thoughtId ?? null);
	// }, [thoughtId]); // This effect runs whenever thoughtId changes

	return (
		<EditorErrorBoundary>
			<ThoughtDetailViewExisting isNewMode={isNewMode} thoughtId={thoughtId} />
		</EditorErrorBoundary>
	);
};

const ThoughtDetailViewExisting = ({ thoughtId, isNewMode }: { thoughtId?: string; isNewMode: boolean }) => {
	const { data: thought, isLoading } = useThought(thoughtId);

	return (
		<SimpleLayout isLoading={Boolean(isLoading && !isNewMode)} className="lg:overflow-hidden items-center px-0">
			<ThoughtDetailViewInner thoughtId={thoughtId} thought={thought ?? undefined} />
		</SimpleLayout>
	);
};

const ThoughtDetailViewInner = ({ thoughtId, thought }: { thoughtId?: string; thought?: Thought }) => {
	const { mutateAsync: editThought } = useEditThought(thoughtId);
	const wsSlug = useWorkspaceSlug();

	const { setIsAiSuggestionLoading } = useThoughtStore();

	const { title } = useTitleStore();

	const navigate = useNavigate();

	const { onChange } = useSave(
		async (payload: ThoughtEditPayload) => {
			const updatedThought = await editThought(payload);

			if (!thoughtId && updatedThought?.id) {
				navigate(makeThoughtUrl(wsSlug, updatedThought.id), {
					replace: true,
					preventScrollReset: true,
				});
			}
		},
		{ debounceDurationMs: thoughtId ? 500 : 0 },
	);

	const headTitle = title ? makeHeadTitle(ellipsizeText(title, 16)) : makeHeadTitle("New Thought");

	useEffect(() => {
		const signals = (thought?.signals as string[] | null) ?? [];
		if (signals.includes(ThoughtSignals.AI_SUGGESTIONS)) {
			setIsAiSuggestionLoading(true);
		} else {
			setIsAiSuggestionLoading(false);
		}
	}, [setIsAiSuggestionLoading, thought?.signals]);

	return (
		<>
			<Helmet>
				<title>{headTitle}</title>
			</Helmet>
			<div className="flex w-full flex-col lg:flex-row lg:h-full xl:max-w-screen-2xl">
				{thoughtId && (
					<EditorView
						thoughtId={thoughtId}
						collections={thought?.collections ?? []}
						remoteContent={thought?.content ?? undefined}
						remoteTitle={thought?.title ?? undefined}
						latestRemoteContentTs={thought?.content_ts ?? undefined}
						latestRemoteTitleTs={thought?.title_ts ?? undefined}
						onChange={onChange}
					/>
				)}
				<ControlColumn thoughtId={thoughtId} />
			</div>
		</>
	);
};

const EditorView = ({
	thoughtId,
	remoteContent,
	remoteTitle,
	latestRemoteContentTs,
	latestRemoteTitleTs,
	collections,
	onChange,
}: {
	thoughtId?: string;
	remoteContent?: string;
	remoteTitle?: string;
	latestRemoteContentTs?: string;
	latestRemoteTitleTs?: string;
	collections: Collection[];
	onChange: (payload: ThoughtEditPayload) => void;
}) => {
	const userRecord = useUserRecord();
	const { highlights } = useHighlightStore();
	const {
		lastLocalThoughtContentTs,
		lastLocalThoughtTitleTs,
		setCurrentContent,
		setLastLocalThoughtContentTs,
		setLastLocalThoughtTitleTs,
	} = useThoughtStore();
	const { title, setTitle, saveTitleKey } = useTitleStore();
	const { previewContent, applyKey, setPreviewContent } = usePreviewContentStore();
	const [isAiWriting, setIsAiWriting] = useState(false);
	const [isConnected, setIsConnected] = useState(false);

	const isHighlightingRef = useRef(false);
	const existingContent = useRef("");

	const { doc: ydoc, provider } = useMemo(() => {
		console.log("gen", thoughtId);
		const doc = new Y.Doc({ guid: thoughtId });
		const p = new SupabaseProvider(supabase, {
			id: thoughtId!,
			name: `thought:${thoughtId}`,
			document: doc,
			databaseDetails: {
				schema: "public",
				table: "notes_test",
				updateColumns: { name: "id", content: "content" },
				conflictColumns: "id",
			},
		});

		return { provider: p, doc };
	}, [thoughtId]);

	useUnmount(() => {
		console.log("unmount", thoughtId);
	});

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
		onUpdate: async () => {
			onUpdate(true);
		},
		autofocus: !thoughtId,
		editable: !isAiWriting,
	}); //

	useEffect(() => {
		console.log("? effect");
		provider.on("synced", () => {
			setIsConnected(true);
		});
	}, [provider]);

	const onUpdate = (isUserUpdate: boolean) => {
		if (!isHighlightingRef.current) {
			const content = editor?.getHTML();
			const contentMd = editor?.storage.markdown.getMarkdown();
			const contentPlainText = editor?.getText();
			const ts = new Date();
			onChange({ content, contentMd, contentPlainText, ts });
			setLastLocalThoughtContentTs(ts);
			setCurrentContent(content ?? "");
		}
	};

	useMount(() => {
		setTitle(remoteTitle ?? "");
		setCurrentContent(remoteContent ?? "");
	});

	useUnmount(() => {
		setTitle("");
	});

	// useUpdateEffect(() => {
	// 	// If the remote content has changed, update the local content
	// 	console.log("latestRemoteContentTs", latestRemoteContentTs, "lastLocalThoughtContentTs", lastLocalThoughtContentTs);
	// 	if (
	// 		(latestRemoteContentTs &&
	// 			lastLocalThoughtContentTs &&
	// 			new Date(latestRemoteContentTs) > lastLocalThoughtContentTs) ||
	// 		!lastLocalThoughtContentTs
	// 	) {
	// 		editor?.commands.setContent(remoteContent ?? "");
	// 		console.log("set via remote content");
	// 	}
	// }, [latestRemoteContentTs]);

	useUpdateEffect(() => {
		// If the remote title has changed, update the local title
		if (
			(latestRemoteTitleTs && lastLocalThoughtTitleTs && new Date(latestRemoteTitleTs) > lastLocalThoughtTitleTs) ||
			!lastLocalThoughtTitleTs
		) {
			setTitle(remoteTitle ?? "");
		}
	}, [latestRemoteTitleTs]);

	useUpdateEffect(() => {
		if (previewContent) {
			existingContent.current = editor?.getHTML() ?? "";
			isHighlightingRef.current = true;

			const existingContentText = editor?.getText() ?? "";

			editor?.commands.setContent(previewContent);

			const newContentText = editor?.getText() ?? "";
			const diff = diffLines(existingContentText, newContentText);

			const addedLines = diff.filter(part => part.added);
			addedLines.forEach(part => {
				if (editor) {
					const lines = part.value.split("\n").filter(line => line.trim().length > 0);
					lines.forEach(line => {
						const results = processSearches(editor.state.doc, line);

						const firstResult = results?.at(0);

						if (firstResult) {
							editor.commands.setTextSelection(firstResult);
							editor.commands.setMark("additionHighlight");
						}
					});
				}
			});
		} else {
			editor?.commands.unsetMark("additionHighlight");
			editor?.commands.setContent(existingContent.current);
			isHighlightingRef.current = false;
		}
	}, [previewContent]); //

	useUpdateEffect(() => {
		isHighlightingRef.current = false;
		editor?.commands.unsetMark("additionHighlight");
		existingContent.current = editor?.getHTML() ?? "";
		editor?.commands.setContent(existingContent.current);
		setPreviewContent(null);
		onUpdate(false);
	}, [applyKey]);

	// Update this effect to use the new CommentHighlight mark
	useEffect(() => {
		if (editor) {
			if (highlights.length > 0) {
				isHighlightingRef.current = true;
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

				isHighlightingRef.current = false;
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

	const handleSetIsHighlighting = (isHighlighting: boolean) => {
		isHighlightingRef.current = isHighlighting;
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
						setIsHighlighting={handleSetIsHighlighting}
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
				<CommentColumn editor={editor} thoughtId={thoughtId} isHighlightingRef={isHighlightingRef} />
			</div>
		</div>
	);
};
