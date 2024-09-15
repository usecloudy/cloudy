import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useUser, useUserOptions } from "src/stores/user";

import { LoadingView } from "../loading/LoadingView";

export const RedirectToDefaultOrg = () => {
	const user = useUser();
	const userOptions = useUserOptions();

	const lastOpenedWorkspaceSlug = userOptions.get("last_opened_workspace") as string | null;

	const { data: orgs, isLoading } = useQuery({
		queryKey: ["workspaces"],
		queryFn: async () => {
			return handleSupabaseError(
				await supabase.from("workspace_users").select("workspaces(slug)").eq("user_id", user.id),
			);
		},
		enabled: !lastOpenedWorkspaceSlug,
	});

	const wsSlug = lastOpenedWorkspaceSlug ? lastOpenedWorkspaceSlug : orgs?.at(0)?.workspaces?.slug;

	if (isLoading) {
		return <LoadingView />;
	}

	if (!wsSlug) {
		return <Navigate to={`/workspaces/new?setup=true`} />;
	}

	return <Navigate to={`/workspaces/${wsSlug}`} />;
};
