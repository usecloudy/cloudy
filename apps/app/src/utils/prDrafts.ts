import { DocumentPrDraftRecord, PrDocsStatus, PrDraftDocumentStatus, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { prQueryKeys, thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

export const useSyncPrComment = () => {
	return useMutation({
		mutationFn: async (params: { prMetadataId: string }) => {
			await apiClient.post("/api/integrations/github/pr-docs/sync-comment", { prMetadataId: params.prMetadataId });
		},
	});
};

export const useUpdateDocumentDraft = () => {
	const syncPrCommentMutation = useSyncPrComment();

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

			syncPrCommentMutation.mutate({ prMetadataId: data?.pr_metadata_id });
		},
	});
};

export const useConvertBackToDraft = () => {
	const updateDocumentDraftMutation = useUpdateDocumentDraft();
	const syncPrCommentMutation = useSyncPrComment();

	return useMutation({
		mutationFn: async (params: { docId: string; prMetadataId: string }) => {
			return await Promise.all([
				updateDocumentDraftMutation.mutateAsync({
					docId: params.docId,
					update: { status: PrDraftDocumentStatus.DRAFT },
				}),
				handleSupabaseError(
					await supabase
						.from("pull_request_metadata")
						.update({ docs_status: PrDocsStatus.DRAFT })
						.eq("id", params.prMetadataId),
				),
			]);
		},
		onSuccess: (_, params) => {
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prDetail(params.prMetadataId) });
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.documentDraft(params.docId) });

			syncPrCommentMutation.mutate({ prMetadataId: params.prMetadataId });
		},
	});
};

export const useDeletePrDrafts = () => {
	const syncPrCommentMutation = useSyncPrComment();

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

			syncPrCommentMutation.mutate({ prMetadataId: params.prMetadataId });
		},
	});
};
