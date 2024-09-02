import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { stripe } from "app/api/utils/stripe";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const POST = async (req: NextRequest) => {
	console.log("Starting stripe customer backfill");

	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const postgresUsersWithoutStripeCustomerId = handleSupabaseError(
		await supabase.from("users").select("*").is("stripe_customer_id", null),
	);

	console.log("Found", postgresUsersWithoutStripeCustomerId.length, "users without a stripe customer id");

	await Promise.all(
		postgresUsersWithoutStripeCustomerId.map(async user => {
			const {
				data: { user: authUser },
			} = await supabase.auth.admin.getUserById(user.id);

			if (!authUser) {
				console.log("User not found in auth.users", user.id);
				return;
			}

			const customers = await stripe.customers.search({
				query: `email:"${authUser.email}"`,
			});

			const existingCustomer = customers.data.at(0);

			if (existingCustomer && !existingCustomer.deleted) {
				console.log("User already has a stripe customer id", user.id, existingCustomer.id);
				await supabase.from("users").update({ stripe_customer_id: existingCustomer.id }).eq("id", user.id);
			} else {
				console.log("Creating stripe customer for user", user.id);
				const customer = await stripe.customers.create({
					name: user.name ?? undefined,
					email: authUser.email,
				});

				console.log("Created stripe customer for user", user.id, customer.id);

				await supabase.from("users").update({ stripe_customer_id: customer.id }).eq("id", user.id);
			}
		}),
	);

	console.log("Finished");

	return NextResponse.json({ success: true });
};
