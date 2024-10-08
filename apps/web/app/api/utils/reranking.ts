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

	const responseData = (await response.json()) as JinaRerankingResponse;

	return responseData.results;
};
