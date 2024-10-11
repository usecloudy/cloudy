import { WorkspacesNewPostResponse, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { queryClient } from "src/api/queryClient";
import { supabase } from "src/clients/supabase";
import { useUserRecord } from "src/stores/user";

export const useCreateWorkspace = () => {
	return useMutation({
		mutationFn: async (data: { name: string; slug: string }) => {
			const workspace = await apiClient.post<WorkspacesNewPostResponse>("/api/workspaces/new", data);
			return workspace.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
		},
	});
};

export const useUserWorkspaces = () => {
	const userRecord = useUserRecord();
	return useQuery({
		queryKey: ["user-workspaces"],
		queryFn: async () =>
			handleSupabaseError(await supabase.from("workspace_users").select("workspace_id").eq("user_id", userRecord.id)),
	});
};
