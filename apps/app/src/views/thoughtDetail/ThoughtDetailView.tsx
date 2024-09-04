import { ThoughtSignals } from "@cloudy/utils/common";
import { Mark, mergeAttributes } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { diffLines } from "diff";
import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useParams } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { useMount, usePrevious, useUnmount, useUpdateEffect } from "react-use";
import { Markdown } from "tiptap-markdown";

import { SimpleLayout } from "src/components/SimpleLayout";
import { useHighlightStore } from "src/stores/highlight";
import { cn } from "src/utils";
import { ellipsizeText, makeHeadTitle } from "src/utils/strings";
import { processSearches } from "src/utils/tiptapSearchAndReplace";
import { useSave } from "src/utils/useSave";
import { useTitleStore } from "src/views/thoughtDetail/titleStore";

import { CollectionCarousel } from "./CollectionCarousel";
import { CommentColumn } from "./CommentColumn";
import { ControlColumn } from "./ControlColumn";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { useEditThought, useThought, useTriggerAiTitleSuggestion } from "./hooks";
import { usePreviewContentStore } from "./previewContentStore";
import { useThoughtStore } from "./thoughtStore";

type Thought = NonNullable<ReturnType<typeof useThought>["data"]>;
type Collection = NonNullable<Thought["collections"]>[0];

export const ThoughtDetailView = () => {
	const { thoughtId } = useParams<{ thoughtId: string }>();

	const prevThoughtId = usePrevious(thoughtId);

	const [isNewMode, setIsNewMode] = useState(thoughtId === "new");
	const [key, setKey] = useState(0);

	// Update isNewMode and key when thoughtId changes
	useUpdateEffect(() => {
		// Check if we're entering or staying in "new" mode
		if (prevThoughtId === "new" || thoughtId === "new") {
			// If we're transitioning from an existing thought to a new one
			if (prevThoughtId !== "new" && thoughtId === "new") {
				// Generate a new key to force a re-render
				setKey(Date.now());
			}
			// Set the mode to "new" for creating a new thought
			setIsNewMode(true);
		} else {
			// We're viewing an existing thought
			setIsNewMode(false);
			// Generate a new key to force a re-render when switching between existing thoughts
			setKey(Date.now());
		}
	}, [thoughtId]); // This effect runs whenever thoughtId changes

	return (
		<ThoughtDetailViewExisting isNewMode={isNewMode} thoughtId={thoughtId === "new" ? undefined : thoughtId} key={key} />
	);
};

const ThoughtDetailViewExisting = ({ thoughtId, isNewMode }: { thoughtId?: string; isNewMode: boolean }) => {
	const { data: thought, isLoading } = useThought(thoughtId);

	return (
		<SimpleLayout isLoading={Boolean(isLoading && !isNewMode)} className="lg:overflow-hidden items-center">
			<ThoughtDetailViewInner thoughtId={thoughtId} thought={thought ?? undefined} />
		</SimpleLayout>
	);
};

const ThoughtDetailViewInner = ({ thoughtId, thought }: { thoughtId?: string; thought?: Thought }) => {
	const { mutateAsync: editThought } = useEditThought(thoughtId);
	const { mutateAsync: triggerAiTitleSuggestion } = useTriggerAiTitleSuggestion(thoughtId);

	const { setIsAiSuggestionLoading } = useThoughtStore();

	const { title } = useTitleStore();

	const navigate = useNavigate();

	const { onChange } = useSave(async (payload: { title?: string; content?: string; contentMd?: string }) => {
		const updatedThought = await editThought(payload);

		if (!thoughtId && updatedThought?.id) {
			navigate(`/thoughts/${updatedThought.id}`, { replace: true, preventScrollReset: true });
		}
	});

	const { onChange: onChangeAiSuggestion } = useSave(
		(payload?: void) => {
			if (!title || title.length <= 2) {
				triggerAiTitleSuggestion();
			}
		},
		{
			debounceDurationMs: 1500,
		},
	);

	const handleWillTriggerAiSuggestion = () => {
		onChangeAiSuggestion();
	};

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
				<EditorView
					thoughtId={thoughtId}
					collections={thought?.collections ?? []}
					remoteContent={thought?.content ?? undefined}
					remoteTitle={thought?.title ?? undefined}
					latestRemoteContentTs={thought?.content_ts ?? undefined}
					latestRemoteTitleTs={thought?.title_ts ?? undefined}
					onChange={onChange}
					onChangeAiSuggestion={handleWillTriggerAiSuggestion}
				/>
				<ControlColumn thoughtId={thoughtId} />
			</div>
		</>
	);
};

// Define a custom CommentHighlight mark
const CommentHighlight = Mark.create({
	name: "commentHighlight",
	renderHTML({ HTMLAttributes }) {
		return ["span", mergeAttributes(HTMLAttributes, { class: "editor-comment-highlight" }), 0];
	},
});

const AdditionHighlight = Mark.create({
	name: "additionHighlight",
	renderHTML({ HTMLAttributes }) {
		return ["span", mergeAttributes(HTMLAttributes, { class: "editor-addition-highlight" }), 0];
	},
});

const EditHighlight = Mark.create({
	name: "editHighlight",
	renderHTML({ HTMLAttributes }) {
		return ["edit", HTMLAttributes, 0];
	},
	parseHTML() {
		return [{ tag: "edit" }];
	},
});

const EditorView = ({
	thoughtId,
	remoteContent,
	remoteTitle,
	latestRemoteContentTs,
	latestRemoteTitleTs,
	collections,
	onChange,
	onChangeAiSuggestion,
}: {
	thoughtId?: string;
	remoteContent?: string;
	remoteTitle?: string;
	latestRemoteContentTs?: string;
	latestRemoteTitleTs?: string;
	collections: Collection[];
	onChange: (payload: { title?: string; content?: string; contentMd?: string }) => void;
	onChangeAiSuggestion: () => void;
}) => {
	const { highlights } = useHighlightStore();
	const { lastLocalThoughtContentTs, lastLocalThoughtTitleTs, setCurrentContent } = useThoughtStore();
	const { title, setTitle, saveTitleKey } = useTitleStore();
	const { previewContent, applyKey, setPreviewContent } = usePreviewContentStore();
	const [isAiWriting, setIsAiWriting] = useState(false);

	const isHighlightingRef = useRef(false);
	const existingContent = useRef("");

	const editor = useEditor({
		extensions: [
			StarterKit.configure({}),
			Placeholder.configure({
				placeholder: "What are you thinking about?",
			}),
			Markdown,
			CommentHighlight,
			AdditionHighlight,
			EditHighlight,
			Underline,
			TaskList.configure({
				HTMLAttributes: {
					class: "editor-task-list",
				},
			}),
			TaskItem.configure({
				nested: true,
				HTMLAttributes: {
					class: "editor-task-item",
				},
			}),
			Typography,
		],
		content: remoteContent ?? "",
		onUpdate: async () => {
			onUpdate(true);
		},
		autofocus: !thoughtId,
		editable: !isAiWriting,
	});

	const onUpdate = (isUserUpdate: boolean) => {
		if (!isHighlightingRef.current) {
			const content = editor?.getHTML();
			const contentMd = editor?.storage.markdown.getMarkdown();
			onChange({ content, contentMd });

			setCurrentContent(content ?? "");

			if (isUserUpdate) {
				onChangeAiSuggestion();
			}
		}
	};

	useMount(() => {
		setTitle(remoteTitle ?? "");
		setCurrentContent(remoteContent ?? "");
	});

	useUnmount(() => {
		setTitle("");
	});

	useUpdateEffect(() => {
		// If the remote content has changed, update the local content
		if (
			(latestRemoteContentTs &&
				lastLocalThoughtContentTs &&
				new Date(latestRemoteContentTs) > lastLocalThoughtContentTs) ||
			!lastLocalThoughtContentTs
		) {
			editor?.commands.setContent(remoteContent ?? "");
		}
	}, [latestRemoteContentTs]);

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
	}, [previewContent]);

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
	});

	useUpdateEffect(() => {
		onChange({ title });
	}, [saveTitleKey]);

	const handleChangeTitle = (title: string) => {
		setTitle(title);
		onChange({ title });
	};

	const handleSetIsHighlighting = (isHighlighting: boolean) => {
		isHighlightingRef.current = isHighlighting;
	};

	return (
		<div className="flex flex-col flex-1 pt-8 lg:py-8 box-border lg:overflow-y-scroll no-scrollbar">
			<div className="flex flex-col gap-2 pb-4">
				<div className="flex w-full flex-row items-start justify-between gap-2">
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
				</div>
				<div className="pr-4">
					<CollectionCarousel thoughtId={thoughtId} collections={collections} />
				</div>
			</div>
			<div
				// On larger screens, we need left padding to avoid some characters being cut off
				className="flex flex-row md:pl-[2px]">
				{editor && thoughtId && (
					<EditorBubbleMenu
						editor={editor}
						setIsHighlighting={handleSetIsHighlighting}
						onUpdate={onUpdate}
						setIsAiWriting={setIsAiWriting}
					/>
				)}
				<EditorContent editor={editor} className={cn("w-full pb-8", isAiWriting && "pointer-events-none opacity-70")} />
				<CommentColumn editor={editor} thoughtId={thoughtId} isHighlightingRef={isHighlightingRef} />
			</div>
		</div>
	);
};
