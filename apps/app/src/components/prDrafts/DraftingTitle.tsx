import { DocumentPrDraftRecord, PrDraftDocumentStatus } from "@cloudy/utils/common";
import { BookDashedIcon, FileCheckIcon, XIcon } from "lucide-react";

export const DraftingTitle = ({ documentDraft }: { documentDraft: DocumentPrDraftRecord }) => {
	const status = documentDraft.status as PrDraftDocumentStatus;

	const iconStates = {
		[PrDraftDocumentStatus.PUBLISHED]: <FileCheckIcon className="size-4 text-accent" />,
		[PrDraftDocumentStatus.DRAFT]: <BookDashedIcon className="size-4 text-secondary" />,
		[PrDraftDocumentStatus.CONFIRMED]: <FileCheckIcon className="size-4 text-accent" />,
		[PrDraftDocumentStatus.SKIPPED]: <XIcon className="size-4 text-secondary" />,
	};

	return (
		<div className="flex flex-row items-center gap-1">
			{iconStates[status]}
			<span className="text-sm font-medium text-secondary">{documentDraft?.path}</span>
		</div>
	);
};
