import { PaymentsCustomersStatusGetResponse, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
	}

	const { stripe_customer_id } = handleSupabaseError(
		await supabase.from("users").select("stripe_customer_id").eq("id", user.id).single(),
	);

	console.log("stripe_customer_id", user.id, stripe_customer_id);

	if (!stripe_customer_id) {
		return NextResponse.json({
			uid: user.id,
			customerStatus: null,
		} satisfies PaymentsCustomersStatusGetResponse);
	}

	const customerStatus = await getCustomerSubscriptionStatus(stripe_customer_id);

	console.log("customerStatus", customerStatus);

	return NextResponse.json({
		uid: user.id,
		customerStatus,
	} satisfies PaymentsCustomersStatusGetResponse);
};
