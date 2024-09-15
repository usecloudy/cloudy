import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export const getOrganizationUserCount = async (orgId: string, supabase: SupabaseClient<Database>) => {
	const count = (await supabase.from("organization_users").select("id", { count: "exact" }).eq("organization_id", orgId))
		.count;
	return count ?? 0;
};
