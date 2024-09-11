import { createOpenAI } from "@ai-sdk/openai";

export const heliconeOpenAI = createOpenAI({
	baseURL: "https://oai.helicone.ai/v1",
	headers: {
		"Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
		"Helicone-Property-Env": process.env.NODE_ENV,
	},
	compatibility: "strict",
});
