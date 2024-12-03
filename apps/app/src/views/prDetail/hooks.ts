import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { queryClient } from "src/api/queryClient";
import { prQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

export const useSkipPrDocs = () => {
	return useMutation({
		mutationFn: async (params: { prMetadataId: string }) => {
			await supabase.from("pull_request_metadata").update({ docs_status: "skipped" }).eq("id", params.prMetadataId);
		},
		onSuccess: (_, params) => {
			queryClient.invalidateQueries({ queryKey: prQueryKeys.prDetail(params.prMetadataId) });
		},
	});
};

export const usePrDetail = () => {
	const { prMetadataId } = useParams();

	return useQuery({
		queryKey: prQueryKeys.prDetail(prMetadataId!),
		queryFn: async () => {
			return handleSupabaseError(
				await supabase
					.from("pull_request_metadata")
					.select(
						"*, repo:repository_connections(owner,name), document_pr_drafts(*, document:thoughts(id, title, content_md))",
					)
					.eq("id", prMetadataId!)
					.single(),
			);
		},
	});
};

export type PrDetailDocumentDraft = NonNullable<ReturnType<typeof usePrDetail>["data"]>["document_pr_drafts"][number];
