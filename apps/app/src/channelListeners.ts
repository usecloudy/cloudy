import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { collectionQueryKeys, thoughtQueryKeys, userQueryKeys } from "./api/queryKeys";
import { supabase } from "./clients/supabase";
import { useUserStore } from "./stores/user";
import { useWorkspaceStore } from "./stores/workspace";

export const useChannelListeners = () => {
	const user = useUserStore(s => s.user);
	const { workspace } = useWorkspaceStore();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!workspace) return;
		if (!user) return;

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
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.workspaceHomeThoughts(workspace.id),
					});
					queryClient.invalidateQueries({
						queryKey: collectionQueryKeys.collectionDetailThoughts(),
					});
				},
			)
			.subscribe();

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
					queryClient.invalidateQueries({
						queryKey: collectionQueryKeys.workspaceCollections(workspace.id),
					});
					queryClient.invalidateQueries({
						queryKey: thoughtQueryKeys.workspaceSidebarLatestThoughts(workspace.id),
					});
					queryClient.invalidateQueries({
						queryKey: collectionQueryKeys.collectionDetailThoughts(),
					});
				},
			)
			.subscribe();

		const userRecordChannel = supabase
			.channel("user_record")
			.on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${user.id}` }, () => {
				queryClient.invalidateQueries({
					queryKey: userQueryKeys.userRecord(),
				});
			})
			.subscribe();

		return () => {
			supabase.removeChannel(customerStatusChannel);
			supabase.removeChannel(workspaceThoughtsChannel);
			supabase.removeChannel(workspaceCollectionThoughtsChannel);
			supabase.removeChannel(userRecordChannel);
		};
	}, [workspace, queryClient, user]);
};
