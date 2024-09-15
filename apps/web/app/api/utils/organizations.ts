import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export const getOrganizationUserCount = async (wsId: string, supabase: SupabaseClient<Database>) => {
	const count = (await supabase.from("workspace_users").select("id", { count: "exact" }).eq("workspace_id", wsId)).count;
	return count ?? 0;
};
