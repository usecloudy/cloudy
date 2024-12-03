import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

import { useDocumentContext } from "./DocumentContext";

export const useDocumentDraft = () => {
	const { documentId } = useDocumentContext();

	return useQuery({
		queryKey: thoughtQueryKeys.documentDraft(documentId),
		queryFn: async () => {
			return handleSupabaseError(
				await supabase
					.from("document_pr_drafts")
					.select("*, pull_request_metadata(*, repo:repository_connections(owner, name))")
					.eq("document_id", documentId)
					.maybeSingle(),
			);
		},
	});
};
