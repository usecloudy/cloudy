import { RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";
import { useContext } from "react";

import { queryClient } from "src/api/queryClient";
import { thoughtQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";

import { ThoughtContext } from "./thoughtContext";

export const useConnectFileToDocument = () => {
	const { thoughtId } = useContext(ThoughtContext);
	return useMutation({
		mutationFn: async (file: RepoReference) => {
			return handleSupabaseError(
				await supabase
					.from("document_repo_links")
					.insert({
						document_id: thoughtId,
						repo_connection_id: file.repoConnectionId,
						path: file.path,
						type: "file" as const,
					})
					.select()
					.single(),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.existingLinkedFiles(thoughtId) });
		},
	});
};

export const useDisconnectFileFromDocument = () => {
	const { thoughtId } = useContext(ThoughtContext);
	return useMutation({
		mutationFn: async (file: { path: string }) => {
			return handleSupabaseError(
				await supabase.from("document_repo_links").delete().eq("document_id", thoughtId).eq("path", file.path),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: thoughtQueryKeys.existingLinkedFiles(thoughtId) });
		},
	});
};
