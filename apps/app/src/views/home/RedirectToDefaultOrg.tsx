import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useUser } from "src/stores/user";

import { LoadingView } from "../loading/LoadingView";

export const RedirectToDefaultOrg = () => {
	const user = useUser();
	const { data: orgs, isLoading } = useQuery({
		queryKey: ["organizations"],
		queryFn: async () => {
			return handleSupabaseError(
				await supabase.from("organization_users").select("organizations(slug)").eq("user_id", user.id),
			);
		},
	});

	const orgSlug = orgs?.at(0)?.organizations?.slug;

	if (isLoading || !orgSlug) {
		return <LoadingView />;
	}

	return <Navigate to={`/organizations/${orgSlug}`} />;
};
