import { RepoReference, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { __getOctokitDevTokenClient, getOctokitAppClient } from "app/api/utils/github";
import { getSupabase } from "app/api/utils/supabase";

export const GET = async (request: NextRequest) => {
	const supabase = getSupabase({ authHeader: request.headers.get("Authorization"), mode: "client" });

	const { searchParams } = request.nextUrl;

	const projectId = searchParams.get("projectId");

	if (!projectId) {
		return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
	}

	// TODO: validate that user has access to this project

	const connections = handleSupabaseError(
		await supabase.from("repository_connections").select("*").eq("project_id", projectId),
	);

	const allRepoPaths = (
		await Promise.all(
			connections.map(async repoConnection => {
				const octokit =
					repoConnection.installation_id === "<TOKEN>"
						? __getOctokitDevTokenClient()
						: getOctokitAppClient(repoConnection.installation_id);

				const repoData = await octokit.rest.repos.get({
					owner: repoConnection.owner,
					repo: repoConnection.name,
				});

				const tree = await octokit.rest.git.getTree({
					owner: repoConnection.owner,
					repo: repoConnection.name,
					tree_sha: repoData.data.default_branch,
					recursive: "true",
				});

				return tree.data.tree.flatMap(treeItem =>
					treeItem.path && treeItem.type !== "commit"
						? [
								{
									repoConnectionId: repoConnection.id,
									repoFullName: repoData.data.full_name,
									path: treeItem.path,
									type: treeItem.type === "blob" ? "file" : "directory",
									fileUrl: treeItem.url ?? "", // TODO better handle this case
								} satisfies RepoReference,
							]
						: [],
				);
			}),
		)
	).flat();

	return NextResponse.json({ paths: allRepoPaths });
};
