import { getSupabase } from "app/api/utils/supabase";

import { respondToComment } from "./utils";

export const maxDuration = 60;

interface RequestBody {
	threadId: string;
}

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { threadId } = (await req.json()) as RequestBody;

	return respondToComment(threadId, supabase);
};
