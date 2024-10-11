import { WorkspaceRole, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { startTrialOnCustomer, stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

type RequestBody = {
	name: string;
	slug: string;
};

export const POST = async (req: NextRequest) => {
	const { name, slug } = (await req.json()) as RequestBody;

	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const customer = await stripe.customers.create({
		name: slug,
		metadata: {
			name,
			slug,
		},
		email: user.email,
	});

	const workspace = handleSupabaseError(
		await supabase
			.from("workspaces")
			.insert({
				name,
				slug,
				stripe_customer_id: customer.id,
				onboarding_status: "initial-collections",
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

	// Start a trial for them
	await startTrialOnCustomer(customer);

	return NextResponse.json({ success: true, wsId: workspace.id, wsSlug: workspace.slug });
};
