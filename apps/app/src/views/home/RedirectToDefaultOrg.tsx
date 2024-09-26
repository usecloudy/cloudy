import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useUser, useUserOptions, useUserRecord } from "src/stores/user";

import { LoadingView } from "../loading/LoadingView";

export const RedirectToDefaultOrg = () => {
	const user = useUser();
	const userOptions = useUserOptions();
	const userRecord = useUserRecord();

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
		staleTime: 0,
	});

	const lastOpenedWorkspaceSlug = userOptions.get("last_opened_workspace") as string | null;
	const wsSlug = lastOpenedWorkspaceSlug ?? data?.orgs?.[0]?.workspaces?.slug;

	const validSlugs = useMemo(() => {
		return new Set(data?.orgs.flatMap(org => (org.workspaces ? [org.workspaces.slug] : [])));
	}, [data]);

	useEffect(() => {
		if (!isLoading && lastOpenedWorkspaceSlug && !validSlugs.has(lastOpenedWorkspaceSlug)) {
			userOptions.set("last_opened_workspace", null);
		}
	}, [lastOpenedWorkspaceSlug, validSlugs, isLoading, userOptions]);

	if (userRecord.is_pending) {
		return <Navigate to="/auth/complete-account-setup" />;
	}

	if (data?.pendingInvites.length) {
		return <Navigate to={`/auth/invite-accept?inviteId=${data.pendingInvites.at(0)!.id}`} />;
	}

	if (isLoading || !data || (wsSlug && !validSlugs.has(wsSlug))) {
		return <LoadingView />;
	}

	if (!wsSlug || validSlugs.size === 0) {
		return <Navigate to={`/workspaces/new/setup`} />;
	}

	return <Navigate to={`/workspaces/${wsSlug}`} />;
};
