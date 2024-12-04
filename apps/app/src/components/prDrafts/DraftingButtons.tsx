import { DocumentPrDraftRecord, PrDraftDocumentStatus } from "@cloudy/utils/common";
import { BookDashedIcon, FileCheckIcon, XIcon } from "lucide-react";

import { Button } from "src/components/Button";
import { useConvertBackToDraft, useUpdateDocumentDraft } from "src/utils/prDrafts";

export const DraftingButtons = ({ documentDraft }: { documentDraft: DocumentPrDraftRecord }) => {
	const updateDocumentDraftMutation = useUpdateDocumentDraft();
	const convertBackToDraftMutation = useConvertBackToDraft();

	if (!documentDraft) {
		return null;
	}

	const status = documentDraft.status as PrDraftDocumentStatus;

	const buttonStates = {
		[PrDraftDocumentStatus.PUBLISHED]: null,
		[PrDraftDocumentStatus.DRAFT]: (
			<>
				<Button
					variant="outline"
					size="sm"
					onClick={e => {
						e.preventDefault();
						e.stopPropagation();
						updateDocumentDraftMutation.mutate({
							docId: documentDraft.document_id,
							update: { status: PrDraftDocumentStatus.SKIPPED },
						});
					}}>
					<XIcon className="size-4" />
					Skip
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="text-accent"
					onClick={e => {
						e.preventDefault();
						e.stopPropagation();
						updateDocumentDraftMutation.mutate({
							docId: documentDraft.document_id,
							update: { status: PrDraftDocumentStatus.CONFIRMED },
						});
					}}>
					<FileCheckIcon className="size-4" />
					Confirm to Publish
				</Button>
			</>
		),
		[PrDraftDocumentStatus.CONFIRMED]: (
			<>
				<Button
					variant="outline"
					size="sm"
					onClick={e => {
						e.preventDefault();
						e.stopPropagation();
						convertBackToDraftMutation.mutate({
							docId: documentDraft.document_id,
							prMetadataId: documentDraft.pr_metadata_id,
						});
					}}>
					<BookDashedIcon className="size-4" />
					Revert to Draft
				</Button>
			</>
		),
		[PrDraftDocumentStatus.SKIPPED]: (
			<>
				<Button
					size="sm"
					variant="outline"
					className="text-accent"
					onClick={e => {
						e.preventDefault();
						e.stopPropagation();
						convertBackToDraftMutation.mutate({
							docId: documentDraft.document_id,
							prMetadataId: documentDraft.pr_metadata_id,
						});
					}}>
					<BookDashedIcon className="size-4" />
					Convert back to Draft
				</Button>
			</>
		),
	};

	return <div className="flex flex-row items-center gap-2">{buttonStates[status]}</div>;
};
