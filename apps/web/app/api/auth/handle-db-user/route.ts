import { Database } from "@repo/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { stripe } from "app/api/utils/stripe";

import { withProtectedRoute } from "../../utils/supabase";

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

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST = withProtectedRoute(async ({ request }) => {
	const payload = (await request.json()) as Payload;

	if (payload.type === "UPDATE") {
		return NextResponse.json(
			{
				message: "Update not implemented",
			},
			{ status: 501 },
		);
	}

	if (payload.type === "INSERT") {
		return handleInsert(payload);
	}

	return handleDelete(payload);
}, "service");

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

const handleInsert = async (payload: InsertPayload) => {
	console.log("Handling insert");

	if (!payload.record.email) {
		throw new Error("User email is required on insert");
	}

	await registerUserToResend(payload.record.email, payload.record.name);

	return NextResponse.json({ success: true, reason: "created_user_record" });
};

const registerUserToResend = async (email: string, name?: string | null) => {
	if (process.env.NODE_ENV === "production") {
		await resend.contacts.create({
			audienceId: "e81314a1-919c-4b0d-b0a3-20b6e8609ed2",
			email,
			firstName: name ?? undefined,
		});
		console.log("User registered to Resend.");
	} else {
		console.log("Skipping user registration to Resend in non-production environment.");
	}
};
