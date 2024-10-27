import { createAppAuth } from "@octokit/auth-app";
import { exchangeWebFlowCode } from "@octokit/oauth-methods";
import { Octokit } from "octokit";

export const getOctokitAppClient = (installationId?: string) => {
	return new Octokit({
		authStrategy: createAppAuth,
		auth: {
			appId: process.env.GITHUB_APP_ID!,
			privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
			installationId,
		},
	});
};

export const getOctokitUserClient = (accessToken: string) => {
	return new Octokit({ auth: accessToken });
};

export const getAccessTokenFromOauthCode = async (code: string) => {
	const { data } = await exchangeWebFlowCode({
		clientType: "github-app",
		clientId: process.env.GITHUB_APP_CLIENT_ID!,
		clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
		code,
	});

	return data.access_token;
};

export const __getOctokitDevTokenClient = () => {
	console.warn("USING DEV TOKEN!");
	return new Octokit({ auth: process.env.GITHUB_DEV_TOKEN! });
};
