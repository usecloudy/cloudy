import { WorkspaceRecord, WorkspaceRole, handleSupabaseError } from "@cloudy/utils/common";
import { create } from "zustand";

import { supabase } from "src/clients/supabase";

export const useWorkspaceStore = create<{
	workspace: WorkspaceRecord | null;
	role: WorkspaceRole | null;
	setWorkspace: (workspace: WorkspaceRecord | null) => void;
	setRole: (role: WorkspaceRole | null) => void;
}>(set => ({
	workspace: null,
	role: null,
	setWorkspace: workspace => set({ workspace }),
	setRole: role => set({ role }),
}));

export const useWorkspace = () => {
	const { workspace } = useWorkspaceStore();
	return workspace!;
};

export const useWorkspaceSlug = () => {
	const { workspace } = useWorkspaceStore();
	return workspace!.slug;
};

export const useWorkspaceRole = () => {
	const { role } = useWorkspaceStore();
	return role!;
};

export const getUserWorkspaceAndRole = async (userId: string) => {
	const workspaceAndRole = handleSupabaseError(
		await supabase.from("workspace_users").select("workspace:workspaces(*), role").eq("user_id", userId).limit(1).single(),
	);

	return workspaceAndRole as { workspace: WorkspaceRecord; role: WorkspaceRole };
};

export const getAllUserWorkspaces = async (userId: string) => {
	const workspaces = handleSupabaseError(
		await supabase.from("workspace_users").select("workspace:workspaces(*)").eq("user_id", userId),
	).flatMap(({ workspace }) => (workspace ? [workspace] : []));

	return workspaces;
};
