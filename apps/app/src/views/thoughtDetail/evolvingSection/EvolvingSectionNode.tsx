import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

import LoadingSpinner from "src/components/LoadingSpinner";

const EvolvingSectionComponent = () => {
	return (
		<NodeViewWrapper className="react-component">
			<div className="flex flex-1 items-center justify-center rounded-sm border border-border bg-card p-2">
				<LoadingSpinner size="sm" />
				evolving!
			</div>
		</NodeViewWrapper>
	);
};

export const EvolvingSectionNode = Node.create({
	name: "evolving-section",

	group: "block",

	atom: true,

	addAttributes() {
		return {
			attachmentId: {
				default: "",
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "evolving-section",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["evolving-section", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EvolvingSectionComponent);
	},
});
