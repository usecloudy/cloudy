import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { collectionQueryKeys, thoughtQueryKeys } from "./api/queryKeys";
import { supabase } from "./clients/supabase";
import { useWorkspaceStore } from "./stores/workspace";

export const useChannelListeners = () => {
	const { workspace } = useWorkspaceStore();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!workspace) return;

		const customerStatusChannel = supabase
			.channel(`workspace_${workspace.id}_customer_status`)
			.on("broadcast", { event: "customer_status_updated" }, payload => {
				// Invalidate the query to refetch the latest data
				queryClient.invalidateQueries({ queryKey: [workspace.slug, "payments", "customers", "status"] });
			})
			.subscribe();

		const workspaceThoughtsChannel = supabase
			.channel("workspace_thoughts")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "thoughts",
					filter: `workspace_id=eq.${workspace.id}`,
				},
				() => {
					queryClient.invalidateQueries({
						queryKey: ["thoughts"],
					});
					queryClient.invalidateQueries({
						queryKey: ["latestThoughts"],
					});
					queryClient.invalidateQueries({
						queryKey: ["collections"],
					});
					queryClient.invalidateQueries({
						queryKey: collectionQueryKeys.workspaceCollections(workspace.id),
					});
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.workspaceSidebarLatestThoughts(workspace.id),
					});
				},
			)
			.subscribe();

		console.log("workspace", workspace.id);
		const workspaceCollectionThoughtsChannel = supabase
			.channel("workspace_collection_thoughts")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "collection_thoughts",
					filter: `workspace_id=eq.${workspace.id}`,
				},
				() => {
					console.log("OH UH");
					queryClient.invalidateQueries({
						queryKey: collectionQueryKeys.workspaceCollections(workspace.id),
					});
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.workspaceSidebarLatestThoughts(workspace.id),
					});
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(customerStatusChannel);
			supabase.removeChannel(workspaceThoughtsChannel);
			supabase.removeChannel(workspaceCollectionThoughtsChannel);
		};
	}, [workspace, queryClient]);
};
