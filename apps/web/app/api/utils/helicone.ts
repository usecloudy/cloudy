import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { randomUUID } from "crypto";

export const heliconeOpenAI = createOpenAI({
	baseURL: "https://oai.helicone.ai/v1",
	headers: {
		"Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
		"Helicone-Property-Env": process.env.NODE_ENV,
		"Helicone-Posthog-Key": process.env.NEXT_PUBLIC_POSTHOG_KEY!,
		"Helicone-Posthog-Host": "https://us.posthog.com",
	},
	compatibility: "strict",
});

export const heliconeAnthropic = createAnthropic({
	baseURL: "https://anthropic.helicone.ai/v1",
	headers: {
		"Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
		"Helicone-Property-Env": process.env.NODE_ENV,
		"Helicone-Posthog-Key": process.env.NEXT_PUBLIC_POSTHOG_KEY!,
		"Helicone-Posthog-Host": "https://us.posthog.com",
	},
});

export interface HeliconeHeaderRequest {
	workspaceId?: string;
	userId?: string;
	sessionName?: string;
	sessionId?: string;
	sessionPath?: string;
}

export const makeHeliconeHeaders = (request: HeliconeHeaderRequest) => {
	const sessionId = request.sessionId || (request.sessionName ? `${request.sessionName}-${randomUUID()}` : randomUUID());
	return {
		...(request.userId && { "Helicone-User-Id": request.userId }),
		...(request.workspaceId && { "Helicone-User-Id": request.workspaceId }),
		...(request.sessionName && { "Helicone-Session-Name": request.sessionName }),
		"Helicone-Session-Id": sessionId,
		...(request.sessionPath && { "Helicone-Session-Path": request.sessionPath }),
	};
};
