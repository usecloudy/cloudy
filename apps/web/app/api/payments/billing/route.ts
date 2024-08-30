import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { searchParams } = new URL(req.url);
	const returnUrl = searchParams.get("returnUrl");

	if (!returnUrl) {
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

	const billingPortalSession = await stripe.billingPortal.sessions.create({
		customer: postgresUser.stripe_customer_id,
		return_url: returnUrl,
	});

	if (!billingPortalSession.url) {
		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
	}

	return NextResponse.json({ url: billingPortalSession.url });
};
