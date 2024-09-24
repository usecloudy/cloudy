import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";

import LoadingSpinner from "src/components/LoadingSpinner";

const PendingAttachmentComponent = () => {
	return (
		<NodeViewWrapper className="react-component">
			<div className="flex flex-1 items-center justify-center rounded-sm border border-border bg-card p-2">
				<LoadingSpinner size="sm" />
			</div>
		</NodeViewWrapper>
	);
};

export const PendingAttachmentNode = Node.create({
	name: "pending-attachment",

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
				tag: "pending-attachment",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return ["pending-attachment", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(PendingAttachmentComponent);
	},
});
