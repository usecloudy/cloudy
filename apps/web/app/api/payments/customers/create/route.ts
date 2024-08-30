import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { stripe } from "app/api/utils/stripe";
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

	if (postgresUser.stripe_customer_id) {
		return NextResponse.json({ error: "User already has a stripe customer id" }, { status: 400 });
	}

	const customers = await stripe.customers.search({
		query: `email:"${user.email}"`,
	});

	const existingCustomer = customers.data.at(0);

	if (existingCustomer && !existingCustomer.deleted) {
		await supabase.from("users").update({ stripe_customer_id: existingCustomer.id }).eq("id", user.id);

		return NextResponse.json({ success: true, reason: "existing_customer" });
	}

	const customer = await stripe.customers.create({
		name: postgresUser.name ?? undefined,
		email: user.email,
	});

	await supabase.from("users").update({ stripe_customer_id: customer.id }).eq("id", user.id);

	return NextResponse.json({ success: true });
};
