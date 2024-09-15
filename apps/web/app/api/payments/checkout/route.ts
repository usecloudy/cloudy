import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus, stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { searchParams } = new URL(req.url);
	const wsSlug = searchParams.get("wsSlug");
	const priceId = searchParams.get("priceId");
	const successUrl = searchParams.get("successUrl");
	const cancelUrl = searchParams.get("cancelUrl");

	if (!priceId || !successUrl || !cancelUrl || !wsSlug) {
		return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
	}

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
	}

	const workspace = handleSupabaseError(await supabase.from("workspaces").select("*").eq("slug", wsSlug).single());
	const workspaceUserCount = handleSupabaseError(
		await supabase.from("workspace_users").select("id").eq("workspace_id", workspace.id),
	).length;

	if (!workspace.stripe_customer_id) {
		return NextResponse.json({ error: "Workspace does not have a stripe customer id" }, { status: 400 });
	}

	const checkoutSession = await stripe.checkout.sessions.create({
		mode: "subscription",
		customer: workspace.stripe_customer_id,
		line_items: [
			{
				price: priceId,
				quantity: workspaceUserCount,
			},
		],
		payment_method_collection: "if_required",
		allow_promotion_codes: true,
		success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: cancelUrl,
	});

	if (!checkoutSession.url) {
		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
	}

	return NextResponse.json({ url: checkoutSession.url });
};
