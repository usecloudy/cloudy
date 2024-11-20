import { Editor } from "@tiptap/react";

export const getAllNodesWithType = (editor: Editor, type: string) => {
	const nodes: { id: string; label: string; pos: number }[] = [];

	editor.view.state.doc.descendants((node, pos) => {
		if (node.type.name === type) {
			nodes.push({
				pos,
				id: node.attrs.id,
				label: node.attrs.label,
			});
		}
	});

	return nodes;
};

export const updateNodeAttributes = (editor: Editor, pos: number, attributes: Record<string, any>) => {
	const { state } = editor;
	const { tr } = state;
	const node = state.doc.nodeAt(pos);

	if (node) {
		tr.setNodeMarkup(pos, null, {
			...node.attrs,
			...attributes,
		});
		editor.view.dispatch(tr);
	}
};
