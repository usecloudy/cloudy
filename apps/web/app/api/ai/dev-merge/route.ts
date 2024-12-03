import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { publishPrDocsOnMerge } from "app/api/utils/prDrafts";
import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: NextRequest) => {
	const supabase = await getSupabase({ mode: "service", bypassAuth: true });
	const repositoryConnection = handleSupabaseError(
		await supabase.from("repository_connections").select("*").eq("id", "ca076ea0-4d17-47ff-a4a3-851027c839b6").single(),
	);
	const diffText = await publishPrDocsOnMerge(repositoryConnection, 35, supabase);

	return NextResponse.json({
		diffText,
	});
};
