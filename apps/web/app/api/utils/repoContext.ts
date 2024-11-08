import { RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

import { __getOctokitDevTokenClient, getOctokitAppClient } from "./github";

export const getContextForRepoReferences = async (
	repoReferences: Pick<RepoReference, "path" | "repoConnectionId" | "type">[],
	supabase: SupabaseClient<Database>,
) => {
	const results = (
		await Promise.all(
			repoReferences.flatMap(async repoReference => {
				const { installation_id, owner, name } = handleSupabaseError(
					await supabase
						.from("repository_connections")
						.select("installation_id, owner, name")
						.eq("id", repoReference.repoConnectionId)
						.single(),
				);
				const octokit =
					installation_id === "<TOKEN>" ? __getOctokitDevTokenClient() : getOctokitAppClient(installation_id);

				if (repoReference.type === "file") {
					const { data: file } = await octokit.rest.repos.getContent({
						owner,
						repo: name,
						path: repoReference.path,
					});

					if (!Array.isArray(file) && file.type === "file") {
						return [
							{
								path: file.path,
								content: Buffer.from(file.content, "base64").toString("utf-8"),
							},
						];
					}

					return [];
				}

				// TODO: Support directories
				return [];
			}),
		)
	).flat();

	return results;
};

export const getFileContents = async (docId: string, supabase: SupabaseClient<Database>) => {
	const repoReferences = handleSupabaseError(
		await supabase
			.from("document_repo_links")
			.select("path, repoConnectionId:repo_connection_id, type")
			.eq("document_id", docId),
	);

	return getContextForRepoReferences(repoReferences as RepoReference[], supabase);
};

export const getFileContentsPrompt = async (docId: string, supabase: SupabaseClient<Database>) => {
	const fileContents = await getFileContents(docId, supabase);

	return fileContents.map(file => `<file path="${file.path}">\n${file.content.trimEnd()}\n</file>`).join("\n\n");
};

export const getCommitPrompt = async (commitSha: string, repoOwner: string, repoName: string, installationId: string) => {
	const octokit = installationId === "<TOKEN>" ? __getOctokitDevTokenClient() : getOctokitAppClient(installationId);

	const { data: commit } = await octokit.rest.repos.getCommit({
		owner: repoOwner,
		repo: repoName,
		ref: commitSha,
	});

	const diffText = commit.files?.map(file => file.patch).join("\n\n");

	return `${commit.commit.message}\n\n${diffText}`;
};

export const getContextForFileReferences = async (fileReferences: RepoReference[], supabase: SupabaseClient<Database>) => {
	const fileContents = await getContextForRepoReferences(fileReferences, supabase);

	return fileContents.map(file => `<file path="${file.path}">\n${file.content.trimEnd()}\n</file>`).join("\n\n");
};
