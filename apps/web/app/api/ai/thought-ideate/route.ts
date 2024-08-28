import { handleSupabaseError } from "@cloudy/utils/common";
import { SupabaseClient } from "@supabase/supabase-js";
import * as jsdiff from "diff";
import { distance } from "fastest-levenshtein";
import { LangfuseExporter } from "langfuse-vercel";
import { NextResponse } from "next/server";

import { getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";

import { checkIfDiffIsSignificant, generateComments, markThoughtAsIdle, markThoughtAsProcessing } from "./utils";

interface Payload {
	thoughtId: string;
}

export const maxDuration = 90;

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return processThought(payload.thoughtId, supabase);
};

const processThought = async (thoughtId: string, supabase: SupabaseClient) => {
	const thought = handleSupabaseError(
		await supabase
			.from("thoughts")
			.select("id, title, content_md, last_suggestion_content_md, suggestion_index, user_intent")
			.eq("id", thoughtId)
			.single(),
	);

	const { content_md: contentMd, last_suggestion_content_md: lastContentMd } = thought;

	if (!contentMd) {
		return NextResponse.json({ success: false, reason: "content_md_not_found" }, { status: 500 });
	}

	if (contentMd.length < 80) {
		console.log("Content too short");
		return NextResponse.json({ success: false, reason: "content_md_too_short" }, { status: 200 });
	}

	if (lastContentMd) {
		const editDistance = distance(contentMd, lastContentMd);
		console.log(`Edit distance: ${editDistance}`);
		if (editDistance < 64) {
			console.log("Content too similar");
			return NextResponse.json({ success: false, reason: "content_md_too_similar" }, { status: 200 });
		}
	}

	// Begin processing
	await markThoughtAsProcessing(thoughtId, supabase);
	const contentOrDiff = lastContentMd ? jsdiff.createPatch("note", lastContentMd, contentMd) : contentMd;
	if (lastContentMd) {
		const diffIsSignificant = await checkIfDiffIsSignificant({ diffString: contentOrDiff });

		console.log(`Diff is significant: ${diffIsSignificant}`);

		if (!diffIsSignificant) {
			console.log(`Content change not significant`);
			await markThoughtAsIdle(thoughtId, supabase);
			return NextResponse.json({ success: true, reason: "content_change_not_significant" }, { status: 200 });
		}
	}

	const existingComments = handleSupabaseError(
		await supabase
			.from("thought_chats")
			.select("*")
			.eq("thought_id", thoughtId)
			.eq("role", "assistant")
			.neq("is_archived", true),
	);

	const relatedChunks = await getRelatedChunkContentsForThought(thoughtId, supabase);

	const { commentsToAdd, commentsToArchive } = await generateComments({
		relatedChunks,
		title: thought.title,
		contentOrDiff,
		intent: thought.user_intent,
		comments: existingComments,
	});

	console.log(`Adding ${commentsToAdd.length} comments and archiving ${commentsToArchive.length} comments`);

	if (commentsToArchive.length > 0) {
		await supabase.from("thought_chats").update({ is_archived: true }).in("id", commentsToArchive);
	}

	if (commentsToAdd.length > 0) {
		const comments = commentsToAdd.map((comment, index) => ({
			thought_id: thoughtId,
			role: "assistant",
			type: comment.type,
			content: comment.content,
			related_chunks: comment.targets,
			created_at: new Date(Date.now() + index).toISOString(),
		}));

		await supabase.from("thought_chats").insert(comments);
	}

	await supabase
		.from("thoughts")
		.update({
			last_suggestion_content_md: contentMd,
			suggestion_status: "idle",
		})
		.eq("id", thoughtId);

	LangfuseExporter.langfuse?.flushAsync();

	return NextResponse.json({ success: true });
};
