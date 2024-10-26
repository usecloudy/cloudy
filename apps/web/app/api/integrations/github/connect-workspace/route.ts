import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getOctokitUserClient } from "app/api/utils/github";
import { getSupabase } from "app/api/utils/supabase";

interface Payload {
	workspaceId: string;
	installationId: string;
	accessToken: string;
}

export const POST = async (request: NextRequest) => {
	getSupabase({ authHeader: request.headers.get("Authorization"), mode: "client" });

	const payload = await request.json();
	const { workspaceId, installationId, accessToken } = payload as Payload;

	// Verify the installation ID by checking if it belongs to the authenticated user
	const octokit = getOctokitUserClient(accessToken);

	try {
		const {
			data: { installations },
		} = await octokit.rest.apps.listInstallationsForAuthenticatedUser();

		const installation = installations.find(installation => installation.id.toString() === installationId);

		if (!installation) {
			return NextResponse.json(
				{ error: "Invalid installation ID - this installation does not belong to your account" },
				{ status: 403 },
			);
		}

		// Authorize a temporary service role supabase client to create the integration record
		const serviceSupabase = getSupabase({ mode: "service", bypassAuth: true });

		handleSupabaseError(
			await serviceSupabase.from("workspace_github_connections").insert({
				installation_id: installationId,
				workspace_id: workspaceId,
			}),
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error verifying GitHub installation:", error);
		return NextResponse.json({ error: "Failed to verify GitHub installation" }, { status: 500 });
	}
};
