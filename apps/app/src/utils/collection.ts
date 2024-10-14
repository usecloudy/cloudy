import { handleSupabaseError } from "@cloudy/utils/common";
import { useMutation } from "@tanstack/react-query";

import { queryClient } from "src/api/queryClient";
import { collectionQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";

export const makeCollectionUrl = (workspaceSlug: string, collectionId: string) => {
	return `/workspaces/${workspaceSlug}/collections/${collectionId}`;
};

export const useCreateCollection = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (payload: { title: string; parentCollectionId?: string }) => {
			const newCollection = handleSupabaseError(
				await supabase
					.from("collections")
					.insert({
						title: payload.title,
						workspace_id: workspace.id,
						parent_collection_id: payload.parentCollectionId,
					})
					.select()
					.single(),
			);

			return newCollection;
		},
		onSuccess: newCollection => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.workspaceCollections(workspace.id) });
			if (newCollection.parent_collection_id) {
				queryClient.invalidateQueries({
					queryKey: collectionQueryKeys.collectionDetailSubCollections(newCollection.parent_collection_id),
				});
			}
		},
	});
};

export const useDeleteCollection = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (payload: { collectionId: string }) => {
			const deletedCollection = handleSupabaseError(
				await supabase.from("collections").delete().eq("id", payload.collectionId).select().single(),
			);

			return deletedCollection;
		},
		onSuccess: deletedCollection => {
			queryClient.invalidateQueries({ queryKey: collectionQueryKeys.workspaceCollections(workspace.id) });
			if (deletedCollection.parent_collection_id) {
				queryClient.invalidateQueries({
					queryKey: collectionQueryKeys.collectionDetailSubCollections(deletedCollection.parent_collection_id),
				});
			}
		},
	});
};
