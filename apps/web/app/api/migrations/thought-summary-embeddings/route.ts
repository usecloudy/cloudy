import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { generateIntentSummaryAndEmbedding } from "app/api/ai/update-thought/embed/embedThought";
import { getSupabase } from "app/api/utils/supabase";

export const maxDuration = 90;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const allThoughts = handleSupabaseError(
		await supabase.from("thoughts").select("id, thought_summary_embeddings(created_at), content_md", { count: "exact" }),
	);

	const thoughtIds = allThoughts
		.filter(t => !t.thought_summary_embeddings && t.content_md && t.content_md.length > 36)
		.map(t => t.id);
	const thoughtRecords = handleSupabaseError(await supabase.from("thoughts").select("*").in("id", thoughtIds));

	console.log("Generating embeddings for", thoughtRecords.length, "thoughts");
	let success = 0;
	let errored = 0;
	await Promise.all(
		thoughtRecords.map(async t => {
			try {
				await generateIntentSummaryAndEmbedding(t, supabase);
				success++;
			} catch (e) {
				console.log("Error generating embedding for thought", t.id, e);
				errored++;
			}
		}),
	);

	return NextResponse.json({ message: "Success", success, errored });
};
