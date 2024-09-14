import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { generateQueryEmbedding } from "app/api/integrations/messages/embeddings";
import { getSupabase } from "app/api/utils/supabase";

interface Payload {
	query: string;
	organization: string;
}

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { query, organization } = (await req.json()) as Payload;

	// Generate query embeddings
	const queryEmbeddings = await generateQueryEmbedding(query);

	if (!queryEmbeddings) {
		return NextResponse.json({ error: "Failed to generate query embeddings" }, { status: 500 });
	}

	// Insert new topic
	const newTopic = handleSupabaseError(await supabase.from("topics").insert({ organization, query }).select().single());

	// Perform embedding search
	const results = handleSupabaseError(
		await supabase.rpc("multi_embedding_search", {
			query_embeddings: queryEmbeddings.map(embedding => JSON.stringify(embedding)),
			match_threshold: 0.7,
			max_results: 10,
		}),
	);

	// Insert topic message matches
	const messageIds = Array.from(new Set(results.map(result => result.message_id)));
	const topicMessageMatches = handleSupabaseError(
		await supabase.from("topic_message_matches").insert(
			messageIds.map(messageId => ({
				topic_id: newTopic.id,
				message_id: messageId,
			})),
		),
	);

	return NextResponse.json({ topic: newTopic, topicMessageMatches });
};
