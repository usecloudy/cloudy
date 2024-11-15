import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";

import { thoughtQueryKeys } from "../../api/queryKeys";
import { supabase } from "../../clients/supabase";
import { useDocumentContext } from "./DocumentContext";

export const useLatestPublishedDocumentVersion = () => {
	const { documentId } = useDocumentContext();

	return useQuery({
		queryKey: thoughtQueryKeys.latestPublishedVersion(documentId),
		queryFn: async () => {
			return handleSupabaseError(
				await supabase
					.from("document_versions")
					.select("content_json, title, created_at, published_by:users(id)")
					.eq("document_id", documentId)
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle(),
			);
		},
	});
};
