import { TopicsNewPostRequestBody } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { updateTopic } from "../update";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { query, workspaceId } = (await req.json()) as TopicsNewPostRequestBody;

	const topic = await updateTopic(query, workspaceId, supabase);

	return NextResponse.json({ topic });
};
