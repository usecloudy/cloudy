import { CollectionThoughtRecord } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { generateCollectionSummary } from "../generateSummary";

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: CollectionThoughtRecord;
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: CollectionThoughtRecord;
	old_record: CollectionThoughtRecord;
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: CollectionThoughtRecord;
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

const extractCollectionId = (payload: Payload) => {
	if (payload.type === "INSERT") {
		return payload.record.collection_id;
	} else if (payload.type === "UPDATE") {
		return payload.record.collection_id;
	} else {
		return payload.old_record.collection_id;
	}
};

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const payload = (await req.json()) as Payload;

	const collectionId = extractCollectionId(payload);

	await generateCollectionSummary(collectionId, supabase);

	return NextResponse.json({ message: "Collection summary generated" });
};
