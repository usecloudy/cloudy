import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

export const getOctokitAppClient = async (installationId?: string) => {
	return new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: process.env.GITHUB_APP_ID!,
			privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
			installationId,
		},
	});
};
