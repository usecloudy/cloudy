import { WorkspaceRole, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

type UserRecord = Database["public"]["Tables"]["users"]["Row"];

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const allUsers = handleSupabaseError(await supabase.from("users").select("*"));

	await Promise.all(allUsers.map(user => createPersonalOrgForUserAndMigrateThoughts(user, supabase)));

	return NextResponse.json({ success: true });
};

const createPersonalOrgForUserAndMigrateThoughts = async (user: UserRecord, supabase: SupabaseClient<Database>) => {
	const orgName = user.name ? `${user.name}'s Space` : "Personal Space";
	const wsSlug = await getOrgSlug(user, supabase);

	console.log(`Creating personal workspace for user ${user.id} with name ${orgName} and slug ${wsSlug}`);

	const workspace = handleSupabaseError(
		await supabase
			.from("workspaces")
			.insert({
				name: orgName,
				slug: wsSlug,
				stripe_customer_id: user.stripe_customer_id,
			})
			.select()
			.single(),
	);

	handleSupabaseError(
		await supabase.from("workspace_users").insert({
			user_id: user.id,
			workspace_id: workspace.id,
			role: WorkspaceRole.OWNER,
		}),
	);

	await migrateThoughts(workspace.id, user.id, supabase);
	await migrateCollections(workspace.id, user.id, supabase);

	console.log(`Migrated user ${user.id}`);
};

const migrateThoughts = async (wsId: string, userId: string, supabase: SupabaseClient<Database>) => {
	const thoughts = handleSupabaseError(
		await supabase
			.from("thoughts")
			.update({
				workspace_id: wsId,
			})
			.eq("author_id", userId)
			.select("id"),
	);

	console.log(`Migrated ${thoughts.length} thoughts for user ${userId}`);
};

const migrateCollections = async (wsId: string, userId: string, supabase: SupabaseClient<Database>) => {
	const collections = handleSupabaseError(
		await supabase
			.from("collections")
			.update({
				workspace_id: wsId,
			})
			.eq("author_id", userId)
			.select("id"),
	);

	console.log(`Migrated ${collections.length} collections for user ${userId}`);
};

const getOrgSlug = async (user: UserRecord, supabase: SupabaseClient<Database>) => {
	if (user.name) {
		const slug = nameToSlug(user.name);
		return `${slug}-personal`;
	}

	const data = await supabase.auth.admin.getUserById(user.id);

	const email = data.data?.user?.email;

	if (email) {
		const firstPart = email.split("@")[0];
		if (firstPart) {
			return `${firstPart}-personal`;
		}
	}

	return generateRandomSlug();
};

const nameToSlug = (name: string) => {
	return name.toLowerCase().replace(/ /g, "-");
};

const generateRandomSlug = (length = 8) => {
	const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};
