import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "./clients/supabase";
import { useWorkspaceStore } from "./stores/workspace";

export const useChannelListeners = () => {
	const { workspace } = useWorkspaceStore();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!workspace) return;

		const channel = supabase.channel(`workspace_${workspace.id}_customer_status`);

		channel
			.on("broadcast", { event: "customer_status_updated" }, payload => {
				// Invalidate the query to refetch the latest data
				queryClient.invalidateQueries({ queryKey: [workspace.slug, "payments", "customers", "status"] });
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [workspace, queryClient]);
};
