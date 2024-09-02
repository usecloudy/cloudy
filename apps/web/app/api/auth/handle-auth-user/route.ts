import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "app/api/utils/stripe";

import { getSupabase } from "../../utils/supabase";

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: Database["auth"]["Tables"]["users"]["Row"];
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: Database["auth"]["Tables"]["users"]["Row"];
	old_record: Database["auth"]["Tables"]["users"]["Row"];
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: Database["auth"]["Tables"]["users"]["Row"];
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

export async function POST(req: NextRequest) {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	if (payload.type === "UPDATE") {
		return NextResponse.json(
			{
				message: "Update not implemented",
			},
			{ status: 501 },
		);
	}

	if (payload.type === "DELETE") {
		return NextResponse.json(
			{
				message: "Delete not implemented",
			},
			{ status: 501 },
		);
	}

	return handleInsert(payload, supabase);
}

const handleInsert = async (payload: InsertPayload, supabase: SupabaseClient<Database>) => {
	console.log("Handling insert");

	const { record } = payload;

	const userRecord = handleSupabaseError(
		await supabase
			.from("users")
			.insert({
				id: record.id,
			})
			.select()
			.single(),
	);

	if (userRecord.stripe_customer_id) {
		throw new Error("User already has a stripe customer id on insert");
	}

	if (!record.email) {
		throw new Error("User email is required on insert");
	}

	const customers = await stripe.customers.search({
		query: `email:"${record.email}"`,
	});

	const existingCustomer = customers.data.at(0);

	if (existingCustomer && !existingCustomer.deleted) {
		console.log("User already has a stripe customer id on insert, using that.");

		await supabase.from("users").update({ stripe_customer_id: existingCustomer.id }).eq("id", payload.record.id);

		return NextResponse.json({ success: true, reason: "existing_customer" });
	}

	console.log(`Creating new stripe customer for user ${record.id}, ${record.email}`);

	const customer = await stripe.customers.create({
		name: userRecord.name ?? undefined,
		email: record.email,
	});

	await supabase.from("users").update({ stripe_customer_id: customer.id }).eq("id", record.id);

	// Start a trial for them

	await startTrialOnCustomer(customer);

	return NextResponse.json({ success: true, reason: "created_customer" });
};

const startTrialOnCustomer = async (customer: Stripe.Customer) => {
	console.log("Starting trial on customer", customer.id);
	const products = await stripe.products.list();

	const activeProducts = products.data.flatMap(product => {
		if (product.active && product.type === "service") {
			return [product];
		}
		return [];
	});

	const firstProduct = activeProducts.at(0);

	if (!firstProduct) {
		throw new Error("No active products found");
	}

	if (!firstProduct.default_price) {
		throw new Error("No default price found for product");
	}

	await stripe.subscriptions.create({
		customer: customer.id,
		items: [
			{
				price: firstProduct.default_price as string,
				quantity: 1,
			},
		],
		trial_period_days: 7,
		trial_settings: {
			end_behavior: {
				missing_payment_method: "cancel",
			},
		},
	});

	console.log("Started trial on customer", customer.id);
};
