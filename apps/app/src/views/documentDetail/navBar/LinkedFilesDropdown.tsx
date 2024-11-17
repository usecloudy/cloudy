import { RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { FolderCodeIcon } from "lucide-react";
import { useContext } from "react";

import { queryClient } from "src/api/queryClient";
import { thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { HelpTooltip } from "src/components/HelpTooltip";
import LoadingSpinner from "src/components/LoadingSpinner";
import { FileReferenceRowStandalone } from "src/views/aiTextArea/FileReferenceRow";

import { Dropdown } from "../../../components/Dropdown";
import { useExistingLinkedFiles } from "../../thoughtDetail/hooks";
import { useDocumentContext } from "../DocumentContext";

const useExitingLinkedFilesAsRepoReferences = () => {
	const { documentId } = useDocumentContext();
	const queryResult = useExistingLinkedFiles(documentId);

	return {
		...queryResult,
		data: queryResult.data?.map(
			file =>
				({
					...file,
					type: "file" as const,
				}) satisfies RepoReference,
		),
	};
};

const useSetFileReferences = () => {
	const { documentId } = useDocumentContext();

	return useMutation({
		mutationFn: async (fileReferences: RepoReference[]) => {
			// Get existing links
			const existingLinks = handleSupabaseError(
				await supabase.from("document_repo_links").select("*").eq("document_id", documentId),
			);

			// Find links to delete (ones that exist but aren't in new fileReferences)
			const linksToDelete = existingLinks.filter(existing => !fileReferences.some(file => file.path === existing.path));

			// Find links to add (ones in fileReferences that don't exist yet)
			const linksToAdd = fileReferences.filter(file => !existingLinks.some(existing => existing.path === file.path));

			// Delete removed links
			if (linksToDelete.length > 0) {
				handleSupabaseError(
					await supabase
						.from("document_repo_links")
						.delete()
						.eq("document_id", documentId)
						.in(
							"path",
							linksToDelete.map(link => link.path),
						),
				);
			}

			// Insert new links
			if (linksToAdd.length > 0) {
				handleSupabaseError(
					await supabase.from("document_repo_links").insert(
						linksToAdd.map(file => ({
							document_id: documentId,
							repo_connection_id: file.repoConnectionId,
							path: file.path,
							type: "file" as const,
						})),
					),
				);
			}
		},
		onMutate: fileReferences => {
			queryClient.setQueryData(thoughtQueryKeys.existingLinkedFiles(documentId), fileReferences);
			return { fileReferences };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.existingLinkedFiles(documentId) });
		},
	});
};

export const LinkedFilesDropdown = ({ trigger }: { trigger: React.ReactNode }) => {
	const { data: linkedFiles, isLoading } = useExitingLinkedFilesAsRepoReferences();

	const setFileReferencesMutation = useSetFileReferences();

	return (
		<Dropdown trigger={trigger}>
			<div className="flex w-[28rem] flex-col gap-2 p-4">
				<h5 className="mb-2 flex items-center gap-1 text-sm font-medium text-secondary">
					<FolderCodeIcon className="size-4 text-secondary" />
					<span>Linked Files</span>
					<HelpTooltip
						content={
							<>
								{"Link this document to files in your git repository."}
								<br />
								<br />
								{
									"Linked files will be included as context to all AI functionality and will be used to keep this document up to date."
								}
							</>
						}
					/>
					{isLoading && <LoadingSpinner size="xs" className="ml-2" />}
				</h5>
				<FileReferenceRowStandalone
					fileReferences={linkedFiles ?? []}
					setFileReferences={setFileReferencesMutation.mutate}
					showUnlinkIconInsteadOfX
				/>
			</div>
		</Dropdown>
	);
};
