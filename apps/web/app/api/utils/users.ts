import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export const waitForUserRecordToExist = async (
	userId: string,
	supabase: SupabaseClient<Database>,
	intervalDuration = 1000,
	maxIterations = 10,
) => {
	for (let i = 0; i < maxIterations; i++) {
		const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

		if (data) {
			return data;
		}

		if (error && error.code !== "PGRST116") {
			throw error;
		}

		await new Promise(resolve => setTimeout(resolve, intervalDuration));
	}

	throw new Error("User record not found after maximum iterations");
};
