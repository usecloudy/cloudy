import { PrStatus, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { createDraftForPr } from ".";

//** Use only for testing */
export const POST = async (req: NextRequest) => {
	const supabase = await getSupabase({ mode: "service", bypassAuth: true });
	const repositoryConnection = handleSupabaseError(
		await supabase.from("repository_connections").select("*").eq("id", "ca076ea0-4d17-47ff-a4a3-851027c839b6").single(),
	);
	const diffText = await createDraftForPr(
		repositoryConnection,
		36,
		"feat(pages): Introduce public library v0",
		"Allows you to partially make any document/folder of your library public on cloudy pages.",
		PrStatus.OPEN,
		"325946f67d701b42a9fbb1a09efb79c02b5c0364",
		"abf4bd2759bc0789b9ec7e475387ccb8cda2216f",
	);

	return NextResponse.json({
		diffText,
	});
};
