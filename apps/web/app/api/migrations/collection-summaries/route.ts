import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { generateCollectionSummary } from "app/api/ai/collection-summarize/generateSummary";
import { getSupabase } from "app/api/utils/supabase";

export const maxDuration = 90;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const collections = handleSupabaseError(
		await supabase
			.from("collections")
			.select("id, summary, intent_embedding")
			.or("summary.is.null,intent_embedding.is.null"),
	);

	console.log("Generating summaries for", collections.length, "collections");
	let success = 0;
	let errored = 0;
	await Promise.all(
		collections.map(async c => {
			try {
				await generateCollectionSummary(c.id, supabase);
				success++;
			} catch (e) {
				console.log("Error generating summary for collection", c.id, e);
				errored++;
			}
		}),
	);

	return NextResponse.json({ message: "Success", success, errored });
};
