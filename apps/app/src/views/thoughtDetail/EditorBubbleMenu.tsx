import { BubbleMenu, Editor } from "@tiptap/react";
import {
	BoldIcon,
	CodeIcon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	SparklesIcon,
	StrikethroughIcon,
	TextQuoteIcon,
	UnderlineIcon,
} from "lucide-react";
import { useContext, useRef, useState } from "react";

import { Button } from "src/components/Button";

import { AiEditorMenu } from "./AiEditorMenu";
import { ThoughtContext } from "./thoughtContext";

const wrapSelectionAroundWords = (editor: Editor) => {
	const selection = editor.state.selection;

	const nodeBeforeText = selection.$from.nodeBefore?.textContent || "";
	const lastWordBefore = nodeBeforeText.split(" ").pop() || "";
	const newFrom = selection.from - lastWordBefore.length;

	const nodeAfterText = selection.$to.nodeAfter?.textContent || "";
	const firstWordAfter = nodeAfterText.split(" ").shift() || "";
	const newTo = selection.to + firstWordAfter.length;

	return {
		from: newFrom,
		to: newTo,
	};
};

export const EditorBubbleMenu = () => {
	const { editor, thoughtId, disableUpdatesRef } = useContext(ThoughtContext);
	const [isEditingSelection, setIsEditingSelection] = useState(false);

	const [selectionToEdit, setSelectionToEdit] = useState<{ from: number; to: number } | null>(null);

	const bubbleMenuRef = useRef<HTMLDivElement>(null);

	const handleOnEdit = () => {
		if (!editor) return;

		disableUpdatesRef.current = true;

		const selection = wrapSelectionAroundWords(editor);
		setSelectionToEdit(selection);

		editor.chain().focus().setTextSelection(selection).setMark("editHighlight").blur().run();
		setIsEditingSelection(true);
	};

	const handleOnCancelEditMode = (isSelectionEvent?: boolean) => {
		setIsEditingSelection(false);
		if (selectionToEdit && !isSelectionEvent) {
			editor?.chain().focus().setTextSelection(selectionToEdit).run();
		}
		setSelectionToEdit(null);
	};

	const handleOnCloseEditMode = () => {
		setIsEditingSelection(false);
		setSelectionToEdit(null);
		disableUpdatesRef.current = false;
	};

	if (!editor) return null;

	return (
		<div>
			<BubbleMenu editor={editor} tippyOptions={{ duration: 100, maxWidth: "1024px" }}>
				<div
					ref={bubbleMenuRef}
					className="flex flex-row items-center bg-background rounded-md border border-border px-2 py-2 gap-0.5">
					<div className="pr-2">
						<Button
							variant="secondary"
							size="sm"
							className="text-accent"
							onMouseDown={e => {
								e.preventDefault();
								handleOnEdit();
							}}>
							<SparklesIcon className="h-3.5 w-3.5" />
							<span>Edit selection</span>
						</Button>
					</div>
					<Button
						onClick={() => editor.chain().focus().toggleBold().run()}
						className={editor.isActive("bold") ? "bg-accent/20 text-accent" : ""}
						variant="ghost"
						size="icon-sm">
						<BoldIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleItalic().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("italic") ? "bg-accent/20 text-accent" : ""}>
						<ItalicIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("underline") ? "bg-accent/20 text-accent" : ""}>
						<UnderlineIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleStrike().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("strike") ? "bg-accent/20 text-accent" : ""}>
						<StrikethroughIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleCode().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("code") ? "bg-accent/20 text-accent" : ""}>
						<CodeIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("bulletList") ? "bg-accent/20 text-accent" : ""}>
						<ListIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("orderedList") ? "bg-accent/20 text-accent" : ""}>
						<ListOrderedIcon className="h-4 w-4" />
					</Button>
					<Button
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						variant="ghost"
						size="icon-sm"
						className={editor.isActive("blockquote") ? "bg-accent/20 text-accent" : ""}>
						<TextQuoteIcon className="h-4 w-4" />
					</Button>
				</div>
			</BubbleMenu>
			{isEditingSelection && selectionToEdit && (
				<AiEditorMenu
					editor={editor}
					thoughtId={thoughtId}
					selectionToEdit={selectionToEdit}
					onCancel={handleOnCancelEditMode}
					onClose={handleOnCloseEditMode}
				/>
			)}
		</div>
	);
};
