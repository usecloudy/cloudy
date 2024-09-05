import { Extension, Node } from "@tiptap/core";

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
