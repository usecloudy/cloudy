import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { embedThought } from "./embedThought";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service", bypassAuth: true });

	const thoughtId = "514e7aa2-1540-4956-aee3-9555fe848c9f";

	await embedThought(thoughtId, supabase);

	return NextResponse.json({ success: true });
};
