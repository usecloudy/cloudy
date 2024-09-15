import { OrganizationRecord, OrganizationRole, handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";

import { supabase } from "src/clients/supabase";

export const useOrganizationStore = create<{
	organization: OrganizationRecord | null;
	role: OrganizationRole | null;
	setOrganization: (organization: OrganizationRecord | null) => void;
	setRole: (role: OrganizationRole | null) => void;
}>(set => ({
	organization: null,
	role: null,
	setOrganization: organization => set({ organization }),
	setRole: role => set({ role }),
}));

export const useOrganization = () => {
	const { organization } = useOrganizationStore();
	return organization!;
};

export const useOrganizationSlug = () => {
	const { organization } = useOrganizationStore();
	return organization!.slug;
};

export const useOrganizationRole = () => {
	const { role } = useOrganizationStore();
	return role!;
};

export const getUserOrganizationAndRole = async (userId: string) => {
	const organizationAndRole = handleSupabaseError(
		await supabase
			.from("organization_users")
			.select("organization:organizations(*), role")
			.eq("user_id", userId)
			.limit(1)
			.single(),
	);

	return organizationAndRole as { organization: OrganizationRecord; role: OrganizationRole };
};

export const getAllUserOrganizations = async (userId: string) => {
	const organizations = handleSupabaseError(
		await supabase.from("organization_users").select("organization:organizations(*)").eq("user_id", userId),
	).flatMap(({ organization }) => (organization ? [organization] : []));

	return organizations;
};
