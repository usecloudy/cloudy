import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus, startTrialOnCustomer, stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
	}

	const postgresUser = handleSupabaseError(await supabase.from("users").select("*").eq("id", user.id).single());

	if (!postgresUser.stripe_customer_id) {
		return NextResponse.json({ error: "User does not have a stripe customer id" }, { status: 400 });
	}

	const customerStatus = await getCustomerSubscriptionStatus(postgresUser.stripe_customer_id);

	if (!customerStatus.isEligibleForTrial) {
		return NextResponse.json({ error: "User is not eligible for a trial" }, { status: 400 });
	}

	const customer = await stripe.customers.retrieve(postgresUser.stripe_customer_id);

	if (!customer || customer.deleted) {
		return NextResponse.json({ error: "Failed to retrieve customer" }, { status: 500 });
	}

	await startTrialOnCustomer(customer);

	return NextResponse.json({ success: true });
};
