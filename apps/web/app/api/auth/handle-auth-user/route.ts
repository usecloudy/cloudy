import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { startTrialOnCustomer, stripe } from "app/api/utils/stripe";

import { getSupabase } from "../../utils/supabase";
import { registerUserToResend } from "./utils";

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

	await registerUserToResend(record.email, userRecord.name);

	return NextResponse.json({ success: true, reason: "created_customer" });
};
