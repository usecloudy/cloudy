import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus, stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { searchParams } = new URL(req.url);
	const priceId = searchParams.get("priceId");

	if (!priceId) {
		return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
	}

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

	await stripe.subscriptions.create({
		customer: postgresUser.stripe_customer_id,
		items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		trial_period_days: 7,
		trial_settings: {
			end_behavior: {
				missing_payment_method: "pause",
			},
		},
	});

	return NextResponse.json({ success: true });
};
