import { PrDocsStatus, PrDraftDocumentStatus, fixOneToOne, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { prQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useSyncPrComment } from "src/utils/prDrafts";

export const useConfirmAllPrDocs = () => {
	const syncPrCommentMutation = useSyncPrComment();

	return useMutation({
		mutationFn: async (params: { prMetadataId: string }) => {
			handleSupabaseError(
				await supabase
					.from("document_pr_drafts")
					.update({ status: PrDraftDocumentStatus.CONFIRMED })
					.eq("pr_metadata_id", params.prMetadataId),
			);
		},
		onSuccess: (_, params) => {
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prDetail(params.prMetadataId) });

			syncPrCommentMutation.mutate({ prMetadataId: params.prMetadataId });
		},
	});
};

export const useDraftPrDocs = () => {
	const syncPrCommentMutation = useSyncPrComment();

	return useMutation({
		mutationFn: async (params: { prMetadataId: string }) => {
			return Promise.all([
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

			syncPrCommentMutation.mutate({ prMetadataId: params.prMetadataId });
		},
	});
};

export const useSkipPrDocs = () => {
	const syncPrCommentMutation = useSyncPrComment();

	return useMutation({
		mutationFn: async (params: { prMetadataId: string }) => {
			return Promise.all([
				handleSupabaseError(
					await supabase
						.from("pull_request_metadata")
						.update({ docs_status: PrDocsStatus.SKIPPED })
						.eq("id", params.prMetadataId),
				),
				handleSupabaseError(
					await supabase
						.from("document_pr_drafts")
						.update({ status: PrDraftDocumentStatus.SKIPPED })
						.eq("pr_metadata_id", params.prMetadataId),
				),
			]);
		},
		onSuccess: (_, params) => {
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prDetail(params.prMetadataId) });

			syncPrCommentMutation.mutate({ prMetadataId: params.prMetadataId });
		},
	});
};

export const usePrDetail = () => {
	const { prMetadataId } = useParams();

	return useQuery({
		queryKey: prQueryKeys.prDetail(prMetadataId!),
		queryFn: async () => {
			const data = handleSupabaseError(
				await supabase
					.from("pull_request_metadata")
					.select(
						"*, repo:repository_connections(owner,name), document_pr_drafts(*, document:thoughts!document_id(id, title, content_md))",
					)
					.eq("id", prMetadataId!)
					.single(),
			);

			return {
				...data,
				document_pr_drafts: data.document_pr_drafts.map(draft => ({
					...draft,
					document: fixOneToOne(draft.document),
				})),
			};
		},
	});
};

export type PrDetailDocumentDraft = NonNullable<ReturnType<typeof usePrDetail>["data"]>["document_pr_drafts"][number];
