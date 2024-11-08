import { Mark, mergeAttributes } from "@tiptap/core";
import { Extension, Node } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import ListKeymap from "@tiptap/extension-list-keymap";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";

import { createCodeBlockPasteRule } from "src/utils/tiptapCodeBlockPasteRule";

import { PendingAttachmentNode } from "./PendingAttachment";
import { Mention, mention } from "./mention";
import ResizableImageExtension from "./resizableImageExtension";

export const IndentNode = Node.create({
	name: "indent",
	content: "block+",
	group: "block",
	addAttributes() {
		return {
			level: {
				default: 1,
				parseHTML: element => parseInt(element.getAttribute("data-level") || "1", 10),
				renderHTML: attributes => ({ "data-level": attributes.level }),
			},
		};
	},
	parseHTML() {
		return [{ tag: "div.indent" }];
	},
	renderHTML({ HTMLAttributes, node }) {
		const level = node.attrs.level || 1;
		return ["div", { class: `indent indent-level-${level}`, ...HTMLAttributes }, 0];
	},
});

export const IndentExtension = Extension.create({
	name: "indentHandler",
	addKeyboardShortcuts() {
		return {
			Tab: ({ editor }) => {
				const { selection } = editor.state;
				const { $from } = selection;

				// Check if we're at the start of a list item
				if (editor.isActive("listItem") && $from.parentOffset === 0) {
					// Attempt to sink the list item
					const sinkResult = editor.chain().sinkListItem("listItem").run();

					// If sinking was successful, return true
					if (sinkResult) {
						return true;
					}
					// If sinking failed, we'll fall through to inserting a tab
				}

				const currentLevel = editor.isActive("indent") ? editor.getAttributes("indent").level : 0;
				if (currentLevel < 3) {
					const newLevel = currentLevel + 1;
					editor.commands.toggleWrap("indent", { level: newLevel });
				}

				// Prevent default behavior (losing focus)
				return true;
			},
			"Shift-Tab": ({ editor }) => {
				const { selection } = editor.state;
				const { $from } = selection;

				// Check if we're at the start of a list item
				if (editor.isActive("listItem") && $from.parentOffset === 0) {
					// If so, lift the list item
					return editor.chain().liftListItem("listItem").run();
				}

				const currentLevel = editor.isActive("indent") ? editor.getAttributes("indent").level : 0;
				if (currentLevel === 1) {
					editor.commands.lift("indent");
				} else if (currentLevel > 1) {
					const newLevel = currentLevel - 1;
					editor.commands.toggleWrap("indent", { level: newLevel });
				}

				// Prevent default behavior (losing focus)
				return true;
			},
		};
	},
});

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
	inclusive: true,
	spanning: true,
	renderHTML({ HTMLAttributes }) {
		return ["edit", HTMLAttributes, 0];
	},
	parseHTML() {
		return [{ tag: "edit" }];
	},
});

/**
 * Matches a code block with backticks.
 */
export const backtickInputRegex = /```([a-z]+)?\s*(.*?)```/;

/**
 * Matches a code block with tildes.
 */
export const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

const ExtendedCodeBlockLowlight = CodeBlockLowlight.extend({
	priority: 1000,
	addPasteRules() {
		return [
			createCodeBlockPasteRule({
				find: (text, event) => {
					const rawMatch = text.match(backtickInputRegex);

					return rawMatch ? [{ index: 0, text: rawMatch[0], match: rawMatch }] : null;
				},
				type: this.type,
			}),
		];
	},
});

export const wrapSelectionAroundWords = (editor: Editor) => {
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

const lowlight = createLowlight(common);

export const tiptapExtensions = [
	StarterKit.configure({
		dropcursor: {
			color: "rgb(var(--color-accent) / 0.6)",
			width: 4,
		},
		history: false,
		codeBlock: false,
	}),
	Placeholder.configure({
		placeholder: "What are you thinking about?",
	}),
	Markdown.configure({
		transformPastedText: true,
	}),
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
	ListKeymap,
	IndentExtension,
	IndentNode,
	Mention.configure({
		suggestion: mention,
	}),
	ResizableImageExtension,
	PendingAttachmentNode,
	Link.configure({
		autolink: true,
		linkOnPaste: true,
		protocols: ["http", "https", "mailto"],
	}),
	ExtendedCodeBlockLowlight.configure({
		lowlight,
	}),
];

export const clearAllEditMarks = (editor: Editor) => {
	const currentSelection = editor.state.selection;

	editor
		.chain()
		.setTextSelection({ from: 0, to: editor.state.doc.content.size })
		.unsetMark("editHighlight")
		.setTextSelection(currentSelection)
		.run();
};

export const clearAllApplyMarks = (editor: Editor) => {
	const currentSelection = editor.state.selection;
	editor
		.chain()
		.setTextSelection({ from: 0, to: editor.state.doc.content.size })
		.unsetMark("additionHighlight")
		.setTextSelection(currentSelection)
		.run();
};
