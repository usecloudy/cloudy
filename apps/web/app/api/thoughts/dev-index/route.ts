import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { embedThought } from "app/api/ai/update-thought/embed/embedThought";
import { getSupabase } from "app/api/utils/supabase";

type Payload = {
	workspaceId: string;
};

export const maxDuration = 90;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	const allThoughtIds = handleSupabaseError(
		await supabase.from("thoughts").select("id").eq("workspace_id", payload.workspaceId),
	);

	await Promise.all(allThoughtIds.map(({ id: thoughtId }) => embedThought(thoughtId, supabase)));

	return NextResponse.json({ success: true });
};
