import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { updateFolderPublicStatus } from "app/api/utils/folders/accessStrategy";
import { withProtectedRoute } from "app/api/utils/supabase";

type Record = Database["public"]["Tables"]["folders"]["Row"];

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

export const POST = withProtectedRoute(async ({ request, supabase }) => {
	const payload = (await request.json()) as Payload;

	return handleFolderChange(payload, supabase);
}, "service");

const handleFolderChange = async (payload: Payload, supabase: SupabaseClient<Database>) => {
	console.log("Handling folder change");

	const affectedFolderIds: string[] = [];

	if (payload.type === "UPDATE" && payload.record && payload.old_record) {
		// Skip if this is just an access_strategy update
		const changedFields = Object.keys(payload.record).filter(
			key => payload.record?.[key as keyof Record] !== payload.old_record?.[key as keyof Record],
		);

		console.log("changedFields", changedFields);

		if (changedFields.length === 0 || (changedFields.length === 1 && changedFields[0] === "access_strategy")) {
			console.log("Skipping access_strategy only update to avoid loop");
			return NextResponse.json({ success: true });
		}

		// If parent changed, we need to update both old and new parent chains
		if (payload.record.parent_id !== payload.old_record.parent_id) {
			if (payload.record.parent_id) affectedFolderIds.push(payload.record.parent_id);
			if (payload.old_record.parent_id) affectedFolderIds.push(payload.old_record.parent_id);
		}
		// Always include the folder itself
		affectedFolderIds.push(payload.record.id);
	} else if (payload.type === "INSERT" && payload.record) {
		// For new folders, update the parent chain
		if (payload.record.parent_id) affectedFolderIds.push(payload.record.parent_id);
		affectedFolderIds.push(payload.record.id);
	} else if (payload.type === "DELETE" && payload.old_record) {
		// For deleted folders, update the parent chain
		if (payload.old_record.parent_id) affectedFolderIds.push(payload.old_record.parent_id);
	}

	if (affectedFolderIds.length) {
		await updateFolderPublicStatus(affectedFolderIds, supabase);
	}

	return NextResponse.json({ success: true });
};
