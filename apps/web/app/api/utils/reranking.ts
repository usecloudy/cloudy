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

// Implement a custom exponential backoff function
const customExponentialBackoff = async <T>(fn: () => Promise<T>, maxRetries = 5, delay = 500): Promise<T> => {
	let attempt = 0;
	while (attempt <= maxRetries) {
		try {
			return await fn();
		} catch (e) {
			if (e instanceof Error && e.message === "Rate limit") {
				const backoffDelay = delay * 2 ** attempt;
				console.log(`Retry attempt ${attempt + 1} for Jina reranking, will wait for ${backoffDelay}ms`);
				await new Promise(resolve => setTimeout(resolve, backoffDelay));
				attempt++;
			} else {
				throw e;
			}
		}
	}
	throw new Error("Max retries exceeded");
};

// Update jinaRerankingWithExponentialBackoff to use the custom backoff function
export const jinaRerankingWithExponentialBackoff = async (query: string, documentContents: string[], topN: number) => {
	return customExponentialBackoff(() => jinaReranking(query, documentContents, topN), 8);
};
