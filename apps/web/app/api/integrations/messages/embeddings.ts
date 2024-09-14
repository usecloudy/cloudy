import fetch from "node-fetch";

interface JinaEmbeddingsResponse {
	data: {
		embeddings: number[][];
	}[];
}

export const createEmbeddings = async (messageContents: string[]): Promise<number[][][]> => {
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

export const generateQueryEmbedding = async (query: string) => {
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
