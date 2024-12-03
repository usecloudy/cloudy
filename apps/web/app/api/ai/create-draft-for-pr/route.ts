import { PrStatus, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { createDraftForPr } from ".";

export const POST = async (req: NextRequest) => {
	const supabase = await getSupabase({ mode: "service", bypassAuth: true });
	const repositoryConnection = handleSupabaseError(
		await supabase.from("repository_connections").select("*").eq("id", "ca076ea0-4d17-47ff-a4a3-851027c839b6").single(),
	);
	const diffText = await createDraftForPr(
		repositoryConnection,
		35,
		"feat(documents): Store with content json instead of content html",
		"Will fallback to reading from content html if content json doesn't exist. This follows the change where document versions rely on content_json.",
		PrStatus.OPEN,
		"e7e52e3f41ece807835dd17b9de26a2f156633d3",
		"19b9d60ac57d27214bcf9964302c071ec6910875",
	);

	return NextResponse.json({
		diffText,
	});
};
