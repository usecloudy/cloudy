import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

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
