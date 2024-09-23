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

interface JinaEmbeddingsResponse {
	data: {
		embeddings: number[][];
	}[];
}

export const createJinaEmbeddings = async (messageContents: string[]): Promise<number[][][]> => {
	const data = {
		model: "jina-colbert-v2",
		dimensions: 128,
		input_type: "document",
		embedding_type: "float",
		input: messageContents,
	};

	const response = await fetch("https://api.jina.ai/v1/multi-vector", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.JINA_API_KEY}`,
		},
		body: JSON.stringify(data),
	});

	const responseData = (await response.json()) as JinaEmbeddingsResponse;

	return responseData.data.map(item => item.embeddings);
};

export const generateJinaQueryEmbedding = async (query: string) => {
	const data = {
		model: "jina-colbert-v2",
		dimensions: 128,
		input_type: "query",
		embedding_type: "float",
		input: [query],
	};

	const response = await fetch("https://api.jina.ai/v1/multi-vector", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.JINA_API_KEY}`,
		},
		body: JSON.stringify(data),
	});

	const responseData = (await response.json()) as JinaEmbeddingsResponse;

	return responseData.data.map(item => item.embeddings).at(0);
};
