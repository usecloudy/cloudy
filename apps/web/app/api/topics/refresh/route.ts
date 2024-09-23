import { TopicsRefreshPostRequestBody, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { updateTopic } from "../update";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { topicId } = (await req.json()) as TopicsRefreshPostRequestBody;

	const topicRecord = handleSupabaseError(await supabase.from("topics").select("*").eq("id", topicId).single());

	await updateTopic(topicRecord.query, topicRecord.workspace_id, supabase, topicRecord.id);

	return NextResponse.json({ success: true });
};
