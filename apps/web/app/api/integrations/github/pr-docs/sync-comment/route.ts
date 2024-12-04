import { handleSupabaseError } from "@cloudy/utils/common";
import { PrDocsStatus, PrDraftDocumentStatus, makePrDraftUrl, makeSkipDocsUrl } from "@cloudy/utils/common";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getOctokitAppClient } from "app/api/utils/github";
import { getSupabase } from "app/api/utils/supabase";
import { getAppBaseUrl } from "app/api/utils/url";

const requestSchema = z.object({
	prMetadataId: z.string(),
});

export const POST = async (req: Request) => {
	try {
		const body = await req.json();
		const { prMetadataId } = requestSchema.parse(body);

		const supabase = await getSupabase({ mode: "service", bypassAuth: true });

		// Get PR metadata and related information
		const prMetadata = handleSupabaseError(
			await supabase
				.from("pull_request_metadata")
				.select(
					`
          *,
          repository_connections(
            id,
            owner,
            name,
            installation_id,
            project_id,
            projects(
              id,
              slug,
              workspaces(
                id,
                slug
              )
            )
          )
        `,
				)
				.eq("id", prMetadataId)
				.single(),
		);

		const repositoryConnection = prMetadata.repository_connections!;
		const project = repositoryConnection.projects!;
		const workspace = project.workspaces!;

		// Get document drafts
		const documentDrafts = handleSupabaseError(
			await supabase
				.from("document_pr_drafts")
				.select(
					`
          *,
          thoughts(
            id,
            title,
            content_md
          )
        `,
				)
				.eq("pr_metadata_id", prMetadataId),
		);

		// Create GitHub comment based on the PR docs status
		const octokit = getOctokitAppClient(repositoryConnection.installation_id);

		let commentBody = "";
		const confirmedDrafts = documentDrafts.filter(draft => draft.status === PrDraftDocumentStatus.CONFIRMED);
		const draftDocs = documentDrafts.filter(draft => draft.status === PrDraftDocumentStatus.DRAFT);
		const skippedDocs = documentDrafts.filter(draft => draft.status === PrDraftDocumentStatus.SKIPPED);
		const publishedDocs = documentDrafts.filter(draft => draft.status === PrDraftDocumentStatus.PUBLISHED);

		switch (prMetadata.docs_status) {
			case PrDocsStatus.DRAFT:
				commentBody = `👋 Here's the current status of your documentation:

${draftDocs.length > 0 ? `📝 **${draftDocs.length} draft${draftDocs.length > 1 ? "s" : ""}** pending review` : ""}
${confirmedDrafts.length > 0 ? `✅ **${confirmedDrafts.length} doc${confirmedDrafts.length > 1 ? "s" : ""}** confirmed for publishing` : ""}
${skippedDocs.length > 0 ? `⏭️ **${skippedDocs.length} doc${skippedDocs.length > 1 ? "s" : ""}** skipped` : ""}

[**📝 Review on Cloudy**](${makePrDraftUrl(getAppBaseUrl(), {
					workspaceSlug: workspace.slug,
					projectSlug: project.slug,
					prMetadataId,
				})})

[🚫 Skip docs for this PR](${makeSkipDocsUrl(getAppBaseUrl(), {
					workspaceSlug: workspace.slug,
					projectSlug: project.slug,
					prMetadataId,
				})})`;
				break;

			case PrDocsStatus.PUBLISHED:
				commentBody = `✨ All documentation has been published! ${publishedDocs.length > 1 ? `**${publishedDocs.length} pages** are now live.` : "The page is now live."}

[**📝 View on Cloudy**](${makePrDraftUrl(getAppBaseUrl(), {
					workspaceSlug: workspace.slug,
					projectSlug: project.slug,
					prMetadataId,
				})})`;
				break;

			case PrDocsStatus.SKIPPED:
				commentBody = `⏭️ Documentation has been skipped for this PR.

[**📝 Review on Cloudy**](${makePrDraftUrl(getAppBaseUrl(), {
					workspaceSlug: workspace.slug,
					projectSlug: project.slug,
					prMetadataId,
				})})`;
				break;
		}

		try {
			// Get all comments on the PR
			const { data: comments } = await octokit.rest.issues.listComments({
				owner: repositoryConnection.owner,
				repo: repositoryConnection.name,
				issue_number: prMetadata.pr_number,
				per_page: 100,
			});

			// Get the app's authentication info to find its comments
			const { data: appInfo } = await octokit.rest.apps.getAuthenticated();

			if (!appInfo?.id) {
				throw new Error("Could not get GitHub app information");
			}

			// Create a copy of comments array before reversing to avoid mutating the original
			const lastAppComment = [...comments]
				.reverse()
				.find(
					comment =>
						comment.user?.type === "Bot" &&
						(comment.user?.id === appInfo.id || comment.performed_via_github_app?.id === appInfo.id),
				);

			if (lastAppComment) {
				// Update the existing comment
				await octokit.rest.issues.updateComment({
					owner: repositoryConnection.owner,
					repo: repositoryConnection.name,
					comment_id: lastAppComment.id,
					body: commentBody,
				});
			} else {
				// Create a new comment if none exists
				await octokit.rest.issues.createComment({
					owner: repositoryConnection.owner,
					repo: repositoryConnection.name,
					issue_number: prMetadata.pr_number,
					body: commentBody,
				});
			}
		} catch (error) {
			console.error("Error handling GitHub comments:", error);
			// Fallback to creating a new comment if there's an error
			await octokit.rest.issues.createComment({
				owner: repositoryConnection.owner,
				repo: repositoryConnection.name,
				issue_number: prMetadata.pr_number,
				body: commentBody,
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error syncing PR comment:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to sync PR comment",
			},
			{ status: 500 },
		);
	}
};
