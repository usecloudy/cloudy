import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import { thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

export const useLatestDocumentVersion = (documentId: string) => {
	return useQuery({
		queryKey: thoughtQueryKeys.latestPublishedVersion(documentId),
		queryFn: async () => {
			return handleSupabaseError(
				await supabase
					.from("document_versions")
					.select("content_json, content_html, title, created_at, published_by:users(id)")
					.eq("document_id", documentId)
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle(),
			);
		},
	});
};

export interface LatestDocumentVersionContextType {
	latestDocumentVersion: Awaited<ReturnType<typeof useLatestDocumentVersion>>["data"];
}

export const LatestDocumentVersionContext = createContext<LatestDocumentVersionContextType>({
	latestDocumentVersion: null,
});

export const useLatestDocumentVersionContext = () => {
	return useContext(LatestDocumentVersionContext);
};
