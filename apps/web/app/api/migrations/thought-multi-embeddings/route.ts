import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { embedThought } from "app/api/ai/update-thought/embed/embedThought";
import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const allThoughtIds = handleSupabaseError(await supabase.from("thoughts").select("id"));

	await Promise.all(allThoughtIds.map(({ id: thoughtId }) => embedThought(thoughtId, supabase)));

	return NextResponse.json({ success: true });
};
