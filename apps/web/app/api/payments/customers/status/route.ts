import { PaymentsCustomersStatusGetResponse, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerSubscriptionStatus } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";
import { getOrganizationUserCount } from "app/api/utils/workspaces";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const wsSlug = req.nextUrl.searchParams.get("wsSlug");

	if (!wsSlug) {
		return NextResponse.json({ error: "Organization slug is required" }, { status: 400 });
	}

	const { id: wsId, stripe_customer_id } = handleSupabaseError(
		await supabase.from("workspaces").select("id, stripe_customer_id").eq("slug", wsSlug).single(),
	);

	console.log("stripe_customer_id", stripe_customer_id);

	if (!stripe_customer_id) {
		return NextResponse.json(
			{
				error: "Org does not have a stripe customer id",
			},
			{ status: 400 },
		);
	}

	const customerStatus = await getCustomerSubscriptionStatus(stripe_customer_id);
	const userCount = await getOrganizationUserCount(wsId, supabase);

	return NextResponse.json({
		wsId: wsId,
		wsSlug,
		customerStatus,
		userCount,
	} satisfies PaymentsCustomersStatusGetResponse);
};
