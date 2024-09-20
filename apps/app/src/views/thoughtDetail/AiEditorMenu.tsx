import { FloatingFocusManager, offset, shift, useFloating } from "@floating-ui/react";
import { useMutation } from "@tanstack/react-query";
import { Editor } from "@tiptap/react";
import { ChevronsLeftIcon, SendHorizonalIcon, SparklesIcon, XIcon } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useMount } from "react-use";

import { apiClient } from "src/api/client";
import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { processSearches } from "src/utils/tiptapSearchAndReplace";

import { ThoughtContext } from "./thoughtContext";

// const selectEditNode = (editor: Editor) => {
// 	let nodePosition = -1;
// 	let nodeLength = 0;
// 	editor.view.state.doc.nodesBetween(0, editor.view.state.doc.content.size, (node, pos) => {
// 		if (node.type.name === "text" && node.marks.length > 0 && node.marks.some(mark => mark.type.name === "editHighlight")) {
// 			nodePosition = pos;
// 			nodeLength = node.textContent?.length ?? 0;
// 		}
// 	});

// 	if (nodePosition !== -1) {
// 		editor
// 			.chain()
// 			.setTextSelection({ from: nodePosition, to: nodePosition + nodeLength })
// 			.focus()
// 			.run();
// 	}
// };

const useEditSelection = (editor: Editor, thoughtId: string) => {
	return useMutation({
		mutationFn: async ({ instruction, content }: { instruction: string; content: string }) => {
			const firstEditStart = content.indexOf("<edit>");
			const lastEditEnd = content.lastIndexOf("</edit>") + 7; // 7 is the length of '</edit>'

			const preppedContent =
				content.substring(0, firstEditStart) +
				"[[[" +
				content.substring(firstEditStart, lastEditEnd).replace(/<\/?edit>/g, "") +
				"]]]" +
				content.substring(lastEditEnd);

			const response = await fetch(apiClient.getUri({ url: "/api/ai/edit-selection" }), {
				method: "POST",
				// @ts-ignore
				headers: {
					...apiClient.defaults.headers.common,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					thoughtId,
					instruction,
					content: preppedContent,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error("Failed to get reader from response");
			}

			let newEditingContent = "";
			let contentToSave = content;

			editor.commands.blur();

			const formContent = () => {
				// Remove leading and trailing backticks if present
				if (newEditingContent.startsWith("```html") || newEditingContent.startsWith("```")) {
					const startIndex = newEditingContent.indexOf("\n") + 1;
					newEditingContent = newEditingContent.substring(startIndex);
				}

				let suffix = "";
				if (!newEditingContent.endsWith("]]]")) {
					suffix = "]]]";
				}

				contentToSave =
					content.substring(0, firstEditStart) + newEditingContent + suffix + content.substring(lastEditEnd);
			};

			const replaceTokens = () => {
				const openingTokens = processSearches(editor.view.state.doc, "[[[", 0.99);
				const closingTokens = processSearches(editor.view.state.doc, "]]]", 0.99);

				if (openingTokens.length > 0 && closingTokens.length > 0) {
					editor
						.chain()
						.setTextSelection({
							from: openingTokens[0].from,
							to: closingTokens[0].to,
						})
						.setMark("editHighlight")
						.deleteRange(closingTokens[0])
						.deleteRange(openingTokens[0])
						.run();
				}
			};

			const processChunks = async () => {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const chunk = new TextDecoder().decode(value);
					newEditingContent += chunk;
					formContent();
					// Use requestAnimationFrame to schedule content updates
					editor.commands.setContent(contentToSave);
					replaceTokens();
				}
			};

			await processChunks();

			newEditingContent += "]]]";

			const finalContent = content.substring(0, firstEditStart) + newEditingContent + content.substring(lastEditEnd);
			editor.commands.setContent(finalContent);

			replaceTokens();
		},
	});
};

export const AiEditorMenu = ({
	thoughtId,
	editor,
	selectionToEdit,
	onCancel,
	onClose,
}: {
	thoughtId: string;
	editor: Editor;
	selectionToEdit: { from: number; to: number };
	onCancel: (isSelectionEvent?: boolean) => void;
	onClose: () => void;
}) => {
	const { disableUpdatesRef, setIsEditingDisabled } = useContext(ThoughtContext);
	const { onUpdate } = useContext(ThoughtContext);

	const { refs, floatingStyles, context } = useFloating({
		open: true,
		placement: "top",
		middleware: [offset(10), shift()],
	});

	useMount(() => {
		refs.setPositionReference({
			// @ts-ignore
			getBoundingClientRect() {
				return document.querySelector("edit")?.getBoundingClientRect();
			},
		});
	});

	const [isApplyMode, setIsApplyMode] = useState(false);
	const [editingText, setEditingText] = useState("");
	const { mutateAsync: editSelection, isPending } = useEditSelection(editor, thoughtId);

	const contentHtmlBeforeEdit = useRef<string | null>(null);
	const contentHtmlAfterEdit = useRef<string | null>(null);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const handleOnCancel = (isSelectionEvent?: boolean) => {
		disableUpdatesRef.current = true;

		if (selectionToEdit) {
			if (contentHtmlBeforeEdit.current) {
				editor.commands.setContent(contentHtmlBeforeEdit.current);
			}

			const selection = editor.state.selection;
			editor
				.chain()
				.setTextSelection(selectionToEdit)
				.focus()
				.unsetMark("editHighlight")
				.setTextSelection(selection)
				.run();
		}

		disableUpdatesRef.current = false;
		setIsApplyMode(false);
		contentHtmlBeforeEdit.current = null;
		contentHtmlAfterEdit.current = null;
		onCancel(isSelectionEvent);
	};

	const handleApply = () => {
		const selection = editor.state.selection;
		editor.chain().selectAll().unsetMark("editHighlight").setTextSelection(selection).run();
		setIsApplyMode(false);
		setEditingText("");
		contentHtmlBeforeEdit.current = null;
		contentHtmlAfterEdit.current = null;
		onClose();
		disableUpdatesRef.current = false;
		onUpdate(false);
	};

	const handleSubmit = async () => {
		if (selectionToEdit) {
			const contentHtmlWithSelectionMarked = editor.getHTML();
			contentHtmlBeforeEdit.current = contentHtmlWithSelectionMarked;
			setIsApplyMode(true);
			setIsEditingDisabled(true);
			await editSelection({
				instruction: editingText,
				content: contentHtmlWithSelectionMarked,
			});
			contentHtmlAfterEdit.current = editor.getHTML();
			setIsEditingDisabled(false);
		}
	};

	const handleRevertHover = () => {
		if (contentHtmlAfterEdit.current) {
			disableUpdatesRef.current = true;
			editor.commands.blur();
			editor.commands.setContent(contentHtmlBeforeEdit.current);
		}
	};

	const undoRevertHover = () => {
		if (contentHtmlBeforeEdit.current) {
			editor.commands.blur();
			editor.commands.setContent(contentHtmlAfterEdit.current);
			disableUpdatesRef.current = false;
		}
	};

	useEffect(() => {
		const onSelectionUpdate = () => {
			if (!isApplyMode) {
				handleOnCancel();
			}
		};

		editor.on("selectionUpdate", onSelectionUpdate);

		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor, selectionToEdit, isApplyMode]);

	return (
		<FloatingFocusManager context={context} initialFocus={textAreaRef}>
			<div
				ref={refs.setFloating}
				style={floatingStyles}
				className="z-50 flex flex-col gap-0.5 rounded-md border border-border bg-background px-2 py-2">
				<div className="flex flex-row items-center gap-1 pb-1 pl-2 pt-1">
					<SparklesIcon className="h-4 w-4 text-accent" />
					<span className="text-sm font-medium">Let Cloudy write for you</span>
				</div>
				<div className="flex flex-row items-end gap-1">
					<TextareaAutosize
						ref={textAreaRef}
						className="no-scrollbar w-72 resize-none appearance-none border-none bg-transparent px-2 py-1.5 text-sm outline-none"
						contentEditable={true}
						placeholder="How should I edit this?"
						value={editingText}
						onChange={e => {
							setEditingText(e.target.value);
						}}
						onKeyDown={e => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit();
							}
						}}
						suppressContentEditableWarning
						autoFocus
					/>
					<div className="flex flex-row items-center gap-1">
						{editingText.length > 0 &&
							(isPending ? (
								<div className="pr-2">
									<LoadingSpinner size="xs" />
								</div>
							) : isApplyMode ? (
								<Button size="sm" onClick={handleApply}>
									<ChevronsLeftIcon className="h-4 w-4" />
									<span>Apply</span>
								</Button>
							) : (
								<Button size="sm" onClick={handleSubmit}>
									<SendHorizonalIcon className="h-4 w-4" />
								</Button>
							))}
						<Button
							variant="secondary"
							size="sm"
							onClick={() => handleOnCancel()}
							onMouseEnter={handleRevertHover}
							onMouseLeave={undoRevertHover}>
							<XIcon className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</FloatingFocusManager>
	);
};
