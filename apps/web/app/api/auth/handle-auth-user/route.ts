import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
	console.log("Handling auth user", req.headers);
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

	const userMetaData = (record.raw_user_meta_data as { full_name: string | null } | null) ?? null;
	const userRecord = handleSupabaseError(
		await supabase
			.from("users")
			.insert({
				id: record.id,
				name: userMetaData?.full_name ?? null,
				email: record.email,
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

	await registerUserToResend(record.email, userRecord.name);

	return NextResponse.json({ success: true, reason: "created_user_record" });
};
