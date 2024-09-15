import { OrganizationRole, handleSupabaseError } from "@cloudy/utils/common";
import { Outlet, useParams } from "react-router-dom";
import { useAsync } from "react-use";

import { supabase } from "src/clients/supabase";
import { useOrganizationStore } from "src/stores/organization";
import { useUser } from "src/stores/user";

import { LoadingView } from "../loading/LoadingView";
import { SubscriptionModal } from "../pricing/PaymentGuard";

const useOrganizationSlug = (orgSlug: string) => {
	const user = useUser();
	const { organization, role, setOrganization, setRole } = useOrganizationStore();

	useAsync(async () => {
		console.log("here");
		const organization = handleSupabaseError(await supabase.from("organizations").select("*").eq("slug", orgSlug).single());
		const { role } = handleSupabaseError(
			await supabase
				.from("organization_users")
				.select("role")
				.eq("user_id", user.id)
				.eq("organization_id", organization.id)
				.single(),
		);

		console.log("organization", organization);

		setOrganization(organization);
		setRole(role as OrganizationRole);

		return organization;
	}, [orgSlug, user.id]);

	return Boolean(organization && role);
};

export const OrganizationLayout = () => {
	const { orgSlug } = useParams();

	const isReady = useOrganizationSlug(orgSlug!);

	if (!isReady) {
		return <LoadingView />;
	}

	return (
		<>
			<Outlet />
			<SubscriptionModal />
		</>
	);
};
