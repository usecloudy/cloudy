import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { generateQueryEmbedding } from "app/api/integrations/messages/embeddings";
import { getSupabase } from "app/api/utils/supabase";

interface Payload {
	topicId: string;
}

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { topicId } = (await req.json()) as Payload;

	const topic = handleSupabaseError(await supabase.from("topics").select("*").eq("id", topicId).single());

	const queryEmbeddings = await generateQueryEmbedding(topic.query);

	if (!queryEmbeddings) {
		return NextResponse.json({ error: "Failed to generate query embeddings" }, { status: 500 });
	}

	const results = handleSupabaseError(
		await supabase.rpc("multi_embedding_search", {
			query_embeddings: queryEmbeddings.map(embedding => JSON.stringify(embedding)),
			match_threshold: 0.7,
			max_results: 10,
		}),
	);

	const messageIds = Array.from(new Set(results.map(result => result.message_id)));

	handleSupabaseError(await supabase.from("topic_message_matches").delete().eq("topic_id", topicId));

	console.log(
		handleSupabaseError(
			await supabase
				.from("integration_messages")
				.select("*")
				.in(
					"id",
					results.map(result => result.message_id),
				),
		).map((m, i) => ({ ...m, result: results[i] })),
	);

	const topicMessageMatches = handleSupabaseError(
		await supabase.from("topic_message_matches").insert(
			messageIds.map(messageI => ({
				topic_id: topicId,
				message_id: messageI,
			})),
		),
	);

	return NextResponse.json({ topicMessageMatches });
};
