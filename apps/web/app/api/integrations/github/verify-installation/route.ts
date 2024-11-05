import { NextRequest, NextResponse } from "next/server";

import { getAccessTokenFromOauthCode, getOctokitUserClient } from "app/api/utils/github";
import { getSupabase } from "app/api/utils/supabase";

export const GET = async (request: NextRequest) => {
	await getSupabase({ authHeader: request.headers.get("Authorization"), mode: "client" });

	const oauthCode = request.nextUrl.searchParams.get("code");
	const installationId = request.nextUrl.searchParams.get("installationId");

	if (!oauthCode) {
		return NextResponse.json({ error: "Missing oauth code" }, { status: 400 });
	}

	const accessToken = await getAccessTokenFromOauthCode(oauthCode);

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

		const account = installation.account;

		return NextResponse.json({ success: true, account, accessToken });
	} catch (error) {
		console.error("Error verifying GitHub installation:", error);
		return NextResponse.json({ error: "Failed to verify GitHub installation" }, { status: 500 });
	}
};
