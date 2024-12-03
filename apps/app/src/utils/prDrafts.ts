import { DocumentPrDraftRecord, PrDraftDocumentStatus, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "src/api/queryClient";
import { prQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

export const useUpdateDocumentDraft = () => {
	return useMutation({
		mutationFn: async (params: { docId: string; update: Partial<DocumentPrDraftRecord> }) => {
			return handleSupabaseError(
				await supabase
					.from("document_pr_drafts")
					.update(params.update)
					.eq("document_id", params.docId)
					.select("pr_metadata_id")
					.single(),
			);
		},
		onSuccess: (data, params) => {
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.documentDraft(params.docId) });
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prDetail(data?.pr_metadata_id) });
		},
	});
};

export const useDeletePrDrafts = () => {
	return useMutation({
		mutationFn: async (params: { prMetadataId: string }) => {
			const drafts = handleSupabaseError(
				await supabase
					.from("document_pr_drafts")
					.select("document_id, status")
					.eq("pr_metadata_id", params.prMetadataId),
			);

			await Promise.all(
				drafts.map(async draft => {
					if (draft.status !== PrDraftDocumentStatus.PUBLISHED && draft.document_id) {
						// Delete the thought first, if the document is not published
						handleSupabaseError(await supabase.from("thoughts").delete().eq("id", draft.document_id));
					}
				}),
			);

			return handleSupabaseError(await supabase.from("pull_request_metadata").delete().eq("id", params.prMetadataId));
		},
		onSuccess: (_, params) => {
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prs() });
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prDetail(params.prMetadataId) });
		},
	});
};
