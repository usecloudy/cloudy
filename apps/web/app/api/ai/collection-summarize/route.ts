import { CollectionSummaryPostRequestBody } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { generateCollectionSummary } from "./generateSummary";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });
	const { collectionId } = (await req.json()) as CollectionSummaryPostRequestBody;

	const summary = await generateCollectionSummary(collectionId, supabase);

	return NextResponse.json(summary);
};
