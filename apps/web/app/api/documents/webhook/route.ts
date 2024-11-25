import { AccessStrategies, getFolderBranch, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { updateFolderPublicStatus } from "app/api/utils/folders/accessStrategy";
import { withProtectedRoute } from "app/api/utils/supabase";

type Record = Database["public"]["Tables"]["thoughts"]["Row"];

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

	if (payload.type === "INSERT" || payload.type === "UPDATE") {
		return handleThoughtChange(payload, supabase);
	}

	return handleThoughtDelete(payload, supabase);
}, "service");

const handleThoughtChange = async (payload: InsertPayload | UpdatePayload, supabase: SupabaseClient<Database>) => {
	console.log("Handling thought insert/update");

	const affectedFolderIds: string[] = [];

	if (payload.type === "UPDATE") {
		// If folder changed, include both old and new folders
		if (payload.record.folder_id !== payload.old_record.folder_id) {
			if (payload.record.folder_id) affectedFolderIds.push(payload.record.folder_id);
			if (payload.old_record.folder_id) affectedFolderIds.push(payload.old_record.folder_id);
		} else if (payload.record.folder_id) {
			// If just access_strategy changed, include current folder
			affectedFolderIds.push(payload.record.folder_id);
		}
	} else if (payload.record.folder_id) {
		// For inserts, just include the new folder
		affectedFolderIds.push(payload.record.folder_id);
	}

	if (affectedFolderIds.length) {
		await updateFolderPublicStatus(affectedFolderIds, supabase);
	}

	return NextResponse.json({ success: true });
};

const handleThoughtDelete = async (payload: DeletePayload, supabase: SupabaseClient<Database>) => {
	console.log("Handling thought delete");

	if (payload.old_record.folder_id) {
		await updateFolderPublicStatus([payload.old_record.folder_id], supabase);
	}

	return NextResponse.json({ success: true });
};

/** Ensures the access strategy of the parent folders is synced to the document */
const ensureParentFoldersArePublic = async (
	folderId: string,
	workspaceId: string,
	projectId: string | null,
	supabase: SupabaseClient<Database>,
) => {
	let foldersQuery = supabase
		.from("folders")
		.select("id, parentId:parent_id, access_strategy")
		.eq("workspace_id", workspaceId)
		.eq("is_root", false);

	if (projectId) {
		foldersQuery = foldersQuery.eq("project_id", projectId);
	}

	const folders = handleSupabaseError(await foldersQuery);

	const branch = getFolderBranch(folderId, folders);

	const branchThatIsNotPublic = branch.filter(f => f.access_strategy !== AccessStrategies.PUBLIC);

	handleSupabaseError(
		await supabase
			.from("folders")
			.update({ access_strategy: AccessStrategies.PUBLIC })
			.in(
				"id",
				branchThatIsNotPublic.map(f => f.id),
			),
	);
};
