import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { distance } from "fastest-levenshtein";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";
import { addSignal, checkForSignal, removeSignal } from "app/api/utils/thoughts";

import { intentSummaryEmbeddingPipeline } from "./embed/embedThought";
import { ideateThought } from "./ideate";
import { suggestTitle } from "./suggest-title";

const MINIMUM_CONTENT_LENGTH = 3;
const MINIMUM_EDIT_DISTANCE = 80;

export const maxDuration = 90;

interface Payload {
	thoughtId: string;
	force?: boolean;
}

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return processThought(payload.thoughtId, supabase, { force: payload.force });
};

const processThought = async (thoughtId: string, supabase: SupabaseClient<Database>, options?: { force?: boolean }) => {
	const thoughtRecord = handleSupabaseError(await supabase.from("thoughts").select("*").eq("id", thoughtId).single());

	const { content_md: contentMd, last_suggestion_content_md: lastContentMd } = thoughtRecord;

	if (!contentMd) {
		console.log("No content_md");
		return new Response(JSON.stringify({ message: "No content_md" }), { headers: { "Content-Type": "application/json" } });
	}

	if (contentMd.length < MINIMUM_CONTENT_LENGTH) {
		console.log("Content too short");
		return NextResponse.json({ message: "Content too short" });
	}

	let editDistance = 0;
	if (!options?.force && lastContentMd) {
		editDistance = distance(contentMd, lastContentMd);

		if (editDistance < MINIMUM_EDIT_DISTANCE) {
			console.log("Content too similar");
			return NextResponse.json({ message: "Content too similar" });
		}
	}

	if (await checkForSignal(ThoughtSignals.AI_THOUGHT_UPDATE, thoughtRecord.id, supabase)) {
		console.log("Already processing");
		return NextResponse.json({ message: "Already processing" });
	}

	console.log(`Processing thought ${thoughtRecord.id}`);

	await addSignal(ThoughtSignals.AI_THOUGHT_UPDATE, thoughtRecord.id, supabase);

	try {
		await Promise.all([
			ideateThought(thoughtRecord, supabase, options),
			suggestTitle(thoughtRecord, supabase),
			intentSummaryEmbeddingPipeline(thoughtRecord, supabase, options?.force),
		]);

		await supabase.from("thoughts").update({ last_suggestion_content_md: contentMd }).eq("id", thoughtRecord.id);
	} finally {
		await removeSignal(ThoughtSignals.AI_THOUGHT_UPDATE, thoughtRecord.id, supabase);
	}

	return NextResponse.json({ message: "Success" });
};
