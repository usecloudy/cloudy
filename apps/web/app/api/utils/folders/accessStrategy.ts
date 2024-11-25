import { AccessStrategies, FolderAccessStrategies, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

/** Updates the access_strategy flag for folders based on their contents and children */
export const updateFolderPublicStatus = async (affectedFolderIds: string[], supabase: SupabaseClient<Database>) => {
	console.log("Updating public status for folders:", affectedFolderIds);

	// Get all ancestor folders using recursive CTE
	const folderTrees = await Promise.all(
		affectedFolderIds.map(async folderId =>
			handleSupabaseError(
				await supabase.rpc("get_folder_ancestors", {
					folder_id: folderId,
				}),
			),
		),
	);

	if (!folderTrees?.length) {
		console.log("No folders to update");
		return;
	}

	// For each folder in tree, check if it has public content
	const updates = (
		await Promise.all(
			folderTrees.map(async folderTree => {
				return Promise.all(
					folderTree.map(async folder => {
						// Check if folder has any public documents
						const { data: publicDocs } = await supabase
							.from("thoughts")
							.select("id")
							.eq("folder_id", folder.id)
							.eq("access_strategy", AccessStrategies.PUBLIC)
							.limit(1);

						// Check if folder has any public child folders
						const { data: publicChildFolders } = await supabase
							.from("folders")
							.select("id")
							.eq("parent_id", folder.id)
							.eq("access_strategy", FolderAccessStrategies.PUBLIC)
							.limit(1);

						const hasPublicContent = !!(publicDocs?.length || publicChildFolders?.length);

						return {
							id: folder.id,
							access_strategy: hasPublicContent
								? FolderAccessStrategies.PUBLIC
								: FolderAccessStrategies.WORKSPACE,
						};
					}),
				);
			}),
		)
	).flat();

	// Update all folders that need updating
	await Promise.all(
		updates.map(async update =>
			handleSupabaseError(
				await supabase.from("folders").update({ access_strategy: update.access_strategy }).eq("id", update.id),
			),
		),
	);

	console.log("Updated public status for folders:", updates);
};
