import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useUser, useUserOptions, useUserRecord } from "src/stores/user";

import { LoadingView } from "../loading/LoadingView";

export const RedirectToDefaultOrg = () => {
	const user = useUser();
	const userOptions = useUserOptions();
	const userRecord = useUserRecord();

	const lastOpenedWorkspaceSlug = userOptions.get("last_opened_workspace") as string | null;

	const { data, isLoading } = useQuery({
		queryKey: ["workspaces"],
		queryFn: async () => {
			const orgs = handleSupabaseError(
				await supabase.from("workspace_users").select("workspaces(slug)").eq("user_id", user.id),
			);
			const pendingInvites = handleSupabaseError(
				await supabase.from("user_pending_invites").select("id").eq("user_id", user.id),
			);
			return { orgs, pendingInvites };
		},
		enabled: !lastOpenedWorkspaceSlug,
		staleTime: 0,
	});

	if (userRecord.is_pending) {
		return <Navigate to="/auth/complete-account-setup" />;
	}

	if (data?.pendingInvites.length) {
		return <Navigate to={`/auth/invite-accept?inviteId=${data.pendingInvites.at(0)!.id}`} />;
	}

	const wsSlug = lastOpenedWorkspaceSlug ? lastOpenedWorkspaceSlug : data?.orgs?.at(0)?.workspaces?.slug;

	if (isLoading) {
		return <LoadingView />;
	}

	if (!wsSlug) {
		return <Navigate to={`/workspaces/new?setup=true`} />;
	}

	return <Navigate to={`/workspaces/${wsSlug}`} />;
};
