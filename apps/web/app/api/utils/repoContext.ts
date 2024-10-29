import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

import { __getOctokitDevTokenClient, getOctokitAppClient } from "./github";

export const getFileContents = async (docId: string, supabase: SupabaseClient<Database>) => {
	const repoReferences = handleSupabaseError(
		await supabase.from("document_repo_links").select("path, repo_connection_id, type").eq("doc_id", docId),
	);

	const results = (
		await Promise.all(
			repoReferences.flatMap(async repoReference => {
				const { installation_id, owner, name } = handleSupabaseError(
					await supabase
						.from("repository_connections")
						.select("installation_id, owner, name")
						.eq("id", repoReference.repo_connection_id)
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

export const getFileContentsPrompt = async (docId: string, supabase: SupabaseClient<Database>) => {
	const fileContents = await getFileContents(docId, supabase);

	return fileContents.map(file => `<file path="${file.path}">\n${file.content.trimEnd()}\n</file>`).join("\n\n");
};
