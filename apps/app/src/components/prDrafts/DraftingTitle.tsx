import { DocumentPrDraftRecord, PrDraftDocumentModificationType, PrDraftDocumentStatus } from "@cloudy/utils/common";
import { BookDashedIcon, FileCheckIcon, XIcon } from "lucide-react";

export const DraftingTitle = ({ documentDraft }: { documentDraft: DocumentPrDraftRecord }) => {
	const status = documentDraft.status as PrDraftDocumentStatus;

	const iconStates = {
		[PrDraftDocumentStatus.PUBLISHED]: <FileCheckIcon className="size-4 text-accent" />,
		[PrDraftDocumentStatus.DRAFT]: <BookDashedIcon className="size-4 text-secondary" />,
		[PrDraftDocumentStatus.CONFIRMED]: <FileCheckIcon className="size-4 text-accent" />,
		[PrDraftDocumentStatus.SKIPPED]: <XIcon className="size-4 text-secondary" />,
	};

	const prefixStates = {
		[PrDraftDocumentModificationType.CREATE]: "Creating",
		[PrDraftDocumentModificationType.EDIT]: "Editing",
	};

	return (
		<div className="flex flex-1 flex-row items-start gap-1">
			<div className="shrink-0 pt-0.5">{iconStates[status]}</div>
			<div className="flex-1 truncate text-sm font-medium text-secondary">
				<span className="font-normal text-tertiary">
					{prefixStates[documentDraft.modification_type as PrDraftDocumentModificationType] + " "}
				</span>
				<span>{documentDraft?.path}</span>
			</div>
		</div>
	);
};
