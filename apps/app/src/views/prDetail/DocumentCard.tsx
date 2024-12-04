import Markdown from "react-markdown";

import { DraftingButtons } from "src/components/prDrafts/DraftingButtons";
import { DraftingTitle } from "src/components/prDrafts/DraftingTitle";
import { cn } from "src/utils";

import { PrDetailDocumentDraft } from "./hooks";

type DocumentCardProps = {
	documentDraft: PrDetailDocumentDraft;
	disableButtons?: boolean;
};

export const DocumentCard = ({ documentDraft, disableButtons }: DocumentCardProps) => {
	return (
		<button
			className={cn(
				"relative flex h-[200px] flex-col gap-2 overflow-hidden rounded-lg border border-border p-4 text-left transition-all hover:border-border hover:bg-card",
			)}>
			<div className="flex w-full flex-row items-start justify-between gap-2">
				<div className="flex flex-1 flex-col gap-1">
					<DraftingTitle documentDraft={documentDraft} />
					<h3 className="mb-2 font-medium">{documentDraft.document?.title}</h3>
				</div>
				{!disableButtons && <DraftingButtons documentDraft={documentDraft} />}
			</div>
			<p className="tiptap relative text-tertiary">
				<Markdown>{documentDraft.document?.content_md}</Markdown>
			</p>
			<div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
		</button>
	);
};
