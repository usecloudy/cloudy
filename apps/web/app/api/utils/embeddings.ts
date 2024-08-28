import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

export const generateEmbeddings = async (inputs: string[], model = "text-embedding-3-small") => {
	console.log(`[generateEmbeddings] Will embed ${inputs.length} chunks.`);

	const { embeddings } = await embedMany({
		model: openai.embedding(model),
		values: inputs,
	});

	return embeddings;
};
