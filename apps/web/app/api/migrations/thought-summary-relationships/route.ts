import { handleSupabaseError } from "@cloudy/utils/common";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { mapRelationshipsForThought } from "app/api/ai/update-thought/embed/embedThought";
import { getSupabase } from "app/api/utils/supabase";

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service" });

	const allThoughts = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select(
				"id, thought_summary_embeddings(created_at), content_md, generated_summary, generated_intent, incoming_relations:thought_relations!matches(created_at), outgoing_relations:thought_relations!matched_by(created_at)",
			),
	);

	const thoughtIds = allThoughts
		.filter(
			t =>
				t.thought_summary_embeddings?.created_at &&
				t.content_md &&
				t.generated_summary &&
				t.generated_intent &&
				t.content_md.length > 36 &&
				(t.incoming_relations.length === 0 || t.outgoing_relations.length === 0),
		)
		.map(t => t.id);
	const thoughtRecords = handleSupabaseError(await supabase.from("thoughts").select("*").in("id", thoughtIds));

	console.log("Generating relationships for", thoughtRecords.length, "thoughts");
	let success = 0;
	let errored = 0;
	await Promise.all(
		thoughtRecords.map(async t => {
			try {
				await mapRelationshipsForThought(t, supabase);
				success++;
			} catch (e) {
				console.log("Error generating relationships for thought", t.id, e);
				Sentry.captureException(e);
				errored++;
			}
		}),
	);

	return NextResponse.json({ message: "Success", success, errored });
};
