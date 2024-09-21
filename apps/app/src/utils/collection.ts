import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "src/api/queryClient";
import { collectionQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";

export const makeCollectionUrl = (wsSlug: string, collectionId: string) => {
	return `/workspaces/${wsSlug}/collections/${collectionId}`;
};

export const useCreateCollection = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (payload: { title: string }) => {
			const newCollection = handleSupabaseError(
				await supabase
					.from("collections")
					.insert({
						title: payload.title,
						workspace_id: workspace.id,
					})
					.select()
					.single(),
			);

			return newCollection;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.workspaceCollections(workspace.id) });
		},
	});
};

export const useDeleteCollection = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (payload: { collectionId: string }) => {
			await supabase.from("collections").delete().eq("id", payload.collectionId);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.workspaceCollections(workspace.id) });
		},
	});
};
