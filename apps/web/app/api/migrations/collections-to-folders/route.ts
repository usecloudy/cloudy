import { handleSupabaseError } from "@cloudy/utils/common";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { heliconeOpenAI, makeHeliconeHeaders } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

export const maxDuration = 180;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const workspaces = handleSupabaseError(await supabase.from("workspaces").select("*").is("folders_migrated_at", null));

	console.log("Processing ", workspaces.length, " workspaces");

	await Promise.all(
		workspaces.map(async workspace => {
			const collections = handleSupabaseError(
				await supabase.from("collections").select("*").eq("workspace_id", workspace.id),
			);

			console.log("processing ", collections.length, " collections");

			// Create the parent root folder if it doesn't exist
			let rootFolder = handleSupabaseError(
				await supabase.from("folders").select("*").eq("workspace_id", workspace.id).eq("is_root", true).maybeSingle(),
			);

			if (!rootFolder) {
				rootFolder = handleSupabaseError(
					await supabase
						.from("folders")
						.insert({
							name: "<ROOT>",
							workspace_id: workspace.id,
							is_root: true,
							parent_id: null,
						})
						.select()
						.single(),
				);
			}

			// const allCollectionIds = Array.from(new Set(collections.map(collection => collection.id)));

			// handleSupabaseError(await supabase.from("folders").delete().in("id", allCollectionIds));

			// Migrate collections to folders
			handleSupabaseError(
				await supabase.from("folders").insert(
					collections.map(collection => ({
						id: collection.id,
						name: collection.title,
						workspace_id: workspace.id,
						parent_id: collection.parent_collection_id ?? rootFolder!.id,
					})),
				),
			);

			const thoughts = handleSupabaseError(
				await supabase
					.from("thoughts")
					.select("*, collections:collection_thoughts(collection:collections(id, title))")
					.eq("workspace_id", workspace.id),
			);

			console.log("processing ", thoughts.length, " thoughts");

			// Migrate thoughts from collections to folders
			await Promise.all(
				thoughts.map(async thought => {
					const collections = thought.collections.map(collection => collection.collection!);

					let newFolderId = null;
					if (collections.length === 1) {
						newFolderId = collections[0]!.id;
					} else if (collections.length > 1) {
						const { object } = await generateObject({
							model: heliconeOpenAI.languageModel("gpt-4o-mini"),
							prompt: `Given the note titled "${thought.title}", it's currently part of the following collections: ${collections.map(collection => `(ID "${collection.id}": "${collection.title}")`).join(", ")}.
	We now are able to select only one collection, where would you move this note to? Return the collection name and ID.`,
							schema: z.object({
								collectionName: z.string(),
								collectionId: z.string(),
							}),
							headers: makeHeliconeHeaders({ sessionName: "migrate-thought-to-collection" }),
						});
						newFolderId = object.collectionId;
					}

					if (newFolderId) {
						handleSupabaseError(
							await supabase
								.from("thoughts")
								.update({
									id: thought.id,
									folder_id: newFolderId,
								})
								.eq("id", thought.id),
						);
					}
				}),
			);

			handleSupabaseError(
				await supabase
					.from("workspaces")
					.update({ folders_migrated_at: new Date().toISOString() })
					.eq("id", workspace.id),
			);

			console.log("successfully migrated thoughts and collections for workspace", workspace.slug);
		}),
	);

	return NextResponse.json({ message: "Success", workspacesProcessed: workspaces.length });
};
