import { PaymentsCustomersStatusGetResponse, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = true;

export const GET = async (req: NextRequest) => {
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
		return NextResponse.json({
			uid: user.id,
			customerStatus: null,
		} satisfies PaymentsCustomersStatusGetResponse);
	}

	const customerStatus = await getCustomerSubscriptionStatus(postgresUser.stripe_customer_id);

	return NextResponse.json({
		uid: user.id,
		customerStatus,
	} satisfies PaymentsCustomersStatusGetResponse);
};
