import { Database } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

import { stripe } from "app/api/utils/stripe";

import { getSupabase } from "../../utils/supabase";

type Record = Database["public"]["Tables"]["users"]["Row"];

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: Record;
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: Record;
	old_record: Record;
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: Record;
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

export async function POST(req: NextRequest) {
	getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	if (payload.type === "UPDATE") {
		return NextResponse.json(
			{
				message: "Update not implemented",
			},
			{ status: 501 },
		);
	}

	if (payload.type === "INSERT") {
		return NextResponse.json(
			{
				message: "Insert not implemented",
			},
			{ status: 501 },
		);
	}

	return handleDelete(payload);
}

const handleDelete = async (payload: DeletePayload) => {
	const { old_record } = payload;

	if (old_record.stripe_customer_id) {
		console.log("Deleting stripe customer for user", old_record.stripe_customer_id);
		await stripe.customers.del(old_record.stripe_customer_id);
	} else {
		console.log("User does not have a stripe customer id on delete, skipping");
	}

	return NextResponse.json({ success: true, reason: "handled" });
};
