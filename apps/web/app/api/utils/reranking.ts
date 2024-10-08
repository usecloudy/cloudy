import { backOff } from "exponential-backoff";

interface JinaRerankingResponse {
	model: string;
	usage: {
		prompt_tokens: number;
		total_tokens: number;
	};
	results: {
		index: number;
		document: {
			text: string;
		};
		relevance_score: number;
	}[];
}

export const jinaReranking = async (query: string, documentContents: string[], topN: number) => {
	const data = {
		model: "jina-reranker-v2-base-multilingual",
		query: query,
		top_n: topN,
		documents: documentContents,
	};

	const response = await fetch("https://api.jina.ai/v1/rerank", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.JINA_API_KEY}`,
		},
		body: JSON.stringify(data),
	});

	if (response.status === 429) {
		throw new Error("Rate limit");
	}

	const responseData = (await response.json()) as JinaRerankingResponse;

	return responseData.results;
};

export const jinaRerankingWithExponentialBackoff = async (query: string, documentContents: string[], topN: number) => {
	return backOff(async () => jinaReranking(query, documentContents, topN), {
		numOfAttempts: 10,
		startingDelay: 1000,
		timeMultiple: 2,
		retry: (e, attemptNumber) => {
			console.log(`Retry attempt ${attemptNumber} for Jina reranking`);
			return e instanceof Error && e.message === "Rate limit";
		},
	});
};
