import { BookDashedIcon } from "lucide-react";
import Markdown from "react-markdown";

import { DraftingButtons } from "src/components/prDrafts/DraftingButtons";
import { DraftingTitle } from "src/components/prDrafts/DraftingTitle";
import { cn } from "src/utils";

import { PrDetailDocumentDraft } from "./hooks";

type DocumentCardProps = {
	documentDraft: PrDetailDocumentDraft;
};

export const DocumentCard = ({ documentDraft }: DocumentCardProps) => {
	return (
		<button
			className={cn(
				"flex h-[200px] flex-col gap-2 overflow-hidden rounded-lg border border-border p-4 text-left transition-all hover:border-border hover:bg-card",
			)}>
			<div className="flex w-full flex-row items-start justify-between">
				<div className="flex flex-col">
					<DraftingTitle documentDraft={documentDraft} />
					<h3 className="mb-2 font-medium">{documentDraft.document?.title}</h3>
				</div>
				<DraftingButtons documentDraft={documentDraft} />
			</div>
			<p className="line-clamp-4 text-sm text-tertiary">
				<Markdown>{documentDraft.document?.content_md}</Markdown>
			</p>
		</button>
	);
};
