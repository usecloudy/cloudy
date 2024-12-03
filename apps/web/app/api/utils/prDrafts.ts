import {
	PrDocsStatus,
	PrDraftDocumentStatus,
	PrStatus,
	RepositoryConnectionRecord,
	createRootFolder,
	getRootFolder,
	handleSupabaseError,
} from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export const publishPrDocsOnMerge = async (
	repositoryConnection: RepositoryConnectionRecord,
	pullRequestNumber: number,
	supabase: SupabaseClient<Database>,
) => {
	const workspaceId = handleSupabaseError(
		await supabase.from("projects").select("workspace_id").eq("id", repositoryConnection.project_id).single(),
	).workspace_id;

	const prData = handleSupabaseError(
		await supabase
			.from("pull_request_metadata")
			.select("*, draft_documents:document_pr_drafts(*)")
			.eq("repository_connection_id", repositoryConnection.id)
			.eq("pr_number", pullRequestNumber)
			.eq("pr_status", PrStatus.OPEN)
			.single(),
	);

	let rootFolder = await getRootFolder({ workspaceId, projectId: repositoryConnection.project_id }, supabase);

	if (!rootFolder) {
		rootFolder = await createRootFolder({ workspaceId, projectId: repositoryConnection.project_id }, supabase);
	}

	// It's important we do this sequentially, so we don't have race conditions
	for (const draft of prData.draft_documents) {
		if (draft.status === PrDraftDocumentStatus.CONFIRMED) {
			// Move document into the library via the path
			const pathSegments = draft.path!.split("/").slice(1);

			let parentId = rootFolder.id;
			for (const segment of pathSegments) {
				const folderId = handleSupabaseError(
					await supabase.from("folders").select("id").eq("name", segment).maybeSingle(),
				)?.id;

				if (folderId) {
					// Go to the next level
					parentId = folderId;
				} else {
					// Create the folder, and set the parentId to the new folder's id
					const newFolder = handleSupabaseError(
						await supabase
							.from("folders")
							.insert({
								name: segment,
								parent_id: parentId,
								workspace_id: workspaceId,
								project_id: repositoryConnection.project_id,
							})
							.select()
							.single(),
					);

					parentId = newFolder.id;
				}
			}

			// Move the document into the folder
			const document = handleSupabaseError(
				await supabase.from("thoughts").update({ folder_id: parentId }).eq("id", draft.document_id).select().single(),
			);

			// Publish the document
			const result = handleSupabaseError(
				await supabase
					.from("document_versions")
					.insert({
						document_id: document.id,
						published_by: null, // TODO: Add the user who published the document
						title: document!.title!,
						content_json: document!.content_json,
						content_md: document!.content_md!,
						content_html: document!.content,
					})
					.select("id")
					.single(),
			);
			handleSupabaseError(await supabase.from("thoughts").update({ latest_version_id: result.id }).eq("id", document.id));

			// Mark the draft as published
			handleSupabaseError(
				await supabase
					.from("document_pr_drafts")
					.update({ status: PrDraftDocumentStatus.PUBLISHED })
					.eq("id", draft.id),
			);
		}
	}

	// Update the pull request metadata to reflect the new status
	handleSupabaseError(
		await supabase
			.from("pull_request_metadata")
			.update({ pr_status: PrStatus.MERGED, docs_status: PrDocsStatus.PUBLISHED })
			.eq("id", prData.id),
	);
};

export const skipPrDocsOnClose = async (
	repositoryConnection: RepositoryConnectionRecord,
	pullRequestNumber: number,
	supabase: SupabaseClient<Database>,
) => {
	const prMetadataId = handleSupabaseError(
		await supabase
			.from("pull_request_metadata")
			.update({ pr_status: PrStatus.CLOSED, docs_status: PrDocsStatus.SKIPPED })
			.eq("repository_connection_id", repositoryConnection.id)
			.eq("pr_number", pullRequestNumber)
			.eq("pr_status", PrStatus.OPEN)
			.select("id")
			.single(),
	).id;

	handleSupabaseError(
		await supabase
			.from("document_pr_drafts")
			.update({ status: PrDraftDocumentStatus.SKIPPED })
			.eq("pr_metadata_id", prMetadataId),
	);
};
