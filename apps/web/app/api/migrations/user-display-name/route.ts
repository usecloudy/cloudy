import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

type UserRecord = Database["public"]["Tables"]["users"]["Row"];

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const allUsers = handleSupabaseError(await supabase.from("users").select("*"));

	await Promise.all(allUsers.map(user => attemptToSetNameForUser(user, supabase)));

	return NextResponse.json({ success: true });
};

const attemptToSetNameForUser = async (user: UserRecord, supabase: SupabaseClient<Database>) => {
	console.log("Setting name for user", user.id);
	const data = await supabase.auth.admin.getUserById(user.id);

	const authUser = data.data?.user;

	if (!authUser) {
		console.log("User not found", user.id);
		return;
	}

	const name = authUser.user_metadata.name;
	console.log(authUser.user_metadata);

	if (name) {
		console.log("Found name", name);
		handleSupabaseError(
			await supabase.from("users").update({
				name: name,
			}),
		);
	} else {
		console.log("No name found", user.id);
	}
};
