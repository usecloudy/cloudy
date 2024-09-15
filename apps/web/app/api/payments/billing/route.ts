import { NextRequest, NextResponse } from "next/server";

import { getOrgStripeCustomerId, stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const searchParams = req.nextUrl.searchParams;
	const orgSlug = searchParams.get("orgSlug");
	const returnUrl = searchParams.get("returnUrl");

	if (!orgSlug || !returnUrl) {
		return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
	}

	const stripeCustomerId = await getOrgStripeCustomerId({ orgSlug }, supabase);

	if (!stripeCustomerId) {
		return NextResponse.json({ error: "Organization not found" }, { status: 404 });
	}

	const billingPortalSession = await stripe.billingPortal.sessions.create({
		customer: stripeCustomerId,
		return_url: returnUrl,
	});

	if (!billingPortalSession.url) {
		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
	}

	return NextResponse.json({ url: billingPortalSession.url });
};
