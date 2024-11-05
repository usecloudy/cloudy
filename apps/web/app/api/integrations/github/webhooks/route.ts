import { handleSupabaseError } from "@cloudy/utils/common";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { createDocumentUpdate } from "app/api/ai/create-document-update";
import { getSupabase } from "app/api/utils/supabase";

interface WebhookPushEvent {
	ref: string;
	repository: {
		id: number;
		name: string;
		full_name: string;
		default_branch: string;
	};
	installation?: {
		id: number;
	};
	commits: Array<{
		id: string;
		message: string;
		added: string[];
		removed: string[];
		modified: string[];
		timestamp: string;
	}>;
}

export const maxDuration = 60;

// Verify that the webhook is actually from GitHub
const verifyGithubWebhook = (payload: string, signature: string | null) => {
	if (!signature) return false;

	const sigHashAlg = "sha256";
	const sigHash = signature.split("=")[1];
	const hmac = crypto.createHmac(sigHashAlg, process.env.GITHUB_WEBHOOK_SECRET!);
	const digest = Buffer.from(hmac.update(payload).digest("hex"), "utf8");
	const checksum = Buffer.from(sigHash!, "utf8");

	return crypto.timingSafeEqual(digest, checksum);
};

export const POST = async (request: NextRequest) => {
	const payload = await request.text();
	const signature = request.headers.get("x-hub-signature-256");
	const event = request.headers.get("x-github-event");

	// Verify webhook signature
	if (!verifyGithubWebhook(payload, signature)) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	const data = JSON.parse(payload) as WebhookPushEvent;

	try {
		switch (event) {
			case "push": {
				// Only process pushes to the default branch
				const branchName = data.ref.replace("refs/heads/", "");
				if (branchName !== data.repository.default_branch) {
					return NextResponse.json({
						message: "Ignoring push to non-default branch",
					});
				}

				if (!data.installation?.id) {
					return NextResponse.json(
						{
							error: "No installation ID found",
						},
						{ status: 400 },
					);
				}

				const supabase = await getSupabase({ mode: "service", bypassAuth: true });

				// Find all repository connections for this repo
				const { data: repoConnections } = await supabase
					.from("repository_connections")
					.select("id, project_id")
					.eq("external_id", data.repository.id.toString());

				if (!repoConnections?.length) {
					return NextResponse.json({
						message: "No repository connections found",
					});
				}

				// Get all document links for these repositories
				const { data: docLinks } = await supabase
					.from("document_repo_links")
					.select("repo_link_id:id, document_id, path, repo_connection_id")
					.in(
						"repo_connection_id",
						repoConnections.map(rc => rc.id),
					);

				if (!docLinks?.length) {
					return NextResponse.json({
						message: "No document links found",
					});
				}

				// Track which files were modified in each commit
				const fileModifications = data.commits.flatMap(commit => {
					const files = [...commit.modified, ...commit.added, ...commit.removed];
					return files.map(file => ({
						path: file,
						timestamp: commit.timestamp,
						sha: commit.id,
					}));
				});

				// Find documents that need to be updated and their latest modifications
				const affectedDocs = docLinks.flatMap(link => {
					const modifications = fileModifications.filter(mod => mod.path === link.path);
					if (modifications.length === 0) return [];

					// Get the latest modification for this file
					const latestMod = modifications.reduce((latest, current) =>
						latest.timestamp > current.timestamp ? latest : current,
					);

					return [
						{
							...link,
							commit_timestamp: latestMod.timestamp,
							commit_sha: latestMod.sha,
						},
					];
				});

				if (affectedDocs.length > 0) {
					// Group affected documents by commit SHA
					const docsByCommit = affectedDocs.reduce(
						(acc, doc) => {
							if (!acc[doc.commit_sha]) {
								acc[doc.commit_sha] = {
									document_id: doc.document_id,
									timestamp: doc.commit_timestamp,
									repo_connection_id: doc.repo_connection_id,
									docs: [],
								};
							}
							acc[doc.commit_sha]!.docs.push(doc);
							return acc;
						},
						{} as Record<
							string,
							{ timestamp: string; document_id: string; repo_connection_id: string; docs: typeof affectedDocs }
						>,
					);

					// Create one document_update per commit per document
					const docUpdates = handleSupabaseError(
						await supabase
							.from("document_updates")
							.insert(
								Object.entries(docsByCommit).flatMap(([commitSha, { docs, repo_connection_id }]) =>
									docs.map(doc => ({
										triggered_at: doc.commit_timestamp,
										commit_sha: commitSha,
										document_id: doc.document_id,
										repo_connection_id,
									})),
								),
							)
							.select(),
					);

					// Create document_update_links for each affected document
					handleSupabaseError(
						await supabase.from("document_update_links").insert(
							docUpdates.flatMap(update => {
								const docsForCommit = docsByCommit[update.commit_sha]!.docs;
								return docsForCommit.map(doc => ({
									document_update_id: update.id,
									repo_link_id: doc.repo_link_id,
								}));
							}),
						),
					);

					if (data.installation) {
						await Promise.all(
							docUpdates.map(async update => {
								await createDocumentUpdate(
									{
										documentUpdateId: update.id,
										installationId: data.installation!.id.toString(),
										repoOwner: data.repository.full_name.split("/")[0]!,
										repoName: data.repository.full_name.split("/")[1]!,
									},
									supabase,
								);
							}),
						);
					}

					console.log(`Created ${docUpdates.length} document updates for ${affectedDocs.length} affected documents`);
				}

				return NextResponse.json({
					success: true,
					processedDocs: affectedDocs.length,
				});
			}

			default:
				console.log(`Unhandled GitHub webhook event: ${event}`);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing GitHub webhook:", error);
		return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
	}
};
