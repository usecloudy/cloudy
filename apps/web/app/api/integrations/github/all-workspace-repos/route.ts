import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getOctokitAppClient } from "app/api/utils/github";
import { getSupabase } from "app/api/utils/supabase";

export const GET = async (request: NextRequest) => {
	const supabase = getSupabase({ authHeader: request.headers.get("Authorization"), mode: "client" });

	const { searchParams } = request.nextUrl;

	const workspaceId = searchParams.get("workspaceId");

	if (!workspaceId) {
		return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
	}

	const appInstallations = handleSupabaseError(
		await supabase.from("workspace_github_connections").select("*").eq("workspace_id", workspaceId),
	);

	const allRepos = (
		await Promise.all(
			appInstallations.map(async installation => {
				try {
					const octokit = getOctokitAppClient(installation.installation_id);

					const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();

					return data.repositories.map(repo => ({
						id: repo.id,
						name: repo.name,
						fullName: repo.full_name,
						private: repo.private,
						description: repo.description,
						defaultBranch: repo.default_branch,
						installationId: installation.installation_id,
					}));
				} catch (error) {
					console.error(error);
					return [];
				}
			}),
		)
	).flat();

	return NextResponse.json({ repositories: allRepos });
};
