import { NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";
import { Database } from "app/db/database.types";

import { respondToComment } from "../utils";

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
	old_record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: Database["public"]["Tables"]["thought_chat_threads"]["Row"];
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

export const maxDuration = 60;

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	if (payload.type !== "INSERT") {
		throw new Error("Need to be an insert");
	}

	if (payload.record.role !== "user") {
		return NextResponse.json({
			success: true,
		});
	}

	return respondToComment(payload.record.comment_id, supabase);
};
