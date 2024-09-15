import { PaymentsCustomersStatusGetResponse, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getOrganizationUserCount } from "app/api/utils/organizations";
import { getCustomerSubscriptionStatus } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const orgSlug = req.nextUrl.searchParams.get("orgSlug");

	if (!orgSlug) {
		return NextResponse.json({ error: "Organization slug is required" }, { status: 400 });
	}

	const { id: orgId, stripe_customer_id } = handleSupabaseError(
		await supabase.from("organizations").select("id, stripe_customer_id").eq("slug", orgSlug).single(),
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
	const userCount = await getOrganizationUserCount(orgId, supabase);

	return NextResponse.json({
		orgId: orgId,
		orgSlug,
		customerStatus,
		userCount,
	} satisfies PaymentsCustomersStatusGetResponse);
};
