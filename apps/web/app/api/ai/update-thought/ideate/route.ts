import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import * as jsdiff from "diff";
import { LangfuseExporter } from "langfuse-vercel";
import { NextResponse } from "next/server";

import { getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { getSupabase } from "app/api/utils/supabase";

import { ThoughtRecord, markThoughtAsProcessing, markThoughtProcessingAsDone } from "../utils";
import { checkIfDiffIsSignificant, generateComments, generateCommentsForSelection } from "./utils";

export const maxDuration = 90;

type Payload = {
	thoughtId: string;
	content: string;
};

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const { thoughtId, content } = (await req.json()) as Payload;

	const thought = handleSupabaseError(await supabase.from("thoughts").select("*").eq("id", thoughtId).single());

	await markThoughtAsProcessing(thoughtId, supabase);

	await ideateSelection(thought, content, supabase);

	await markThoughtProcessingAsDone(thoughtId, supabase);

	return NextResponse.json({ success: true });
};

export const ideateSelection = async (thought: ThoughtRecord, content: string, supabase: SupabaseClient<Database>) => {
	const { id: thoughtId, title, user_intent } = thought;

	const existingComments = handleSupabaseError(
		await supabase
			.from("thought_chats")
			.select("*")
			.eq("thought_id", thoughtId)
			.eq("role", "assistant")
			.neq("is_archived", true),
	);

	const relatedChunks = await getRelatedChunkContentsForThought(thoughtId, supabase);

	const { commentsToAdd } = await generateCommentsForSelection({
		relatedChunks,
		title,
		contentWithSelection: content,
		intent: user_intent,
		comments: existingComments,
	});

	console.log(`Adding ${commentsToAdd.length} comments`);

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

	LangfuseExporter.langfuse?.flushAsync();

	return;
};

export const ideateThought = async (thought: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	const {
		id: thoughtId,
		content_md: contentMd,
		last_suggestion_content_md: lastContentMd,
		is_suggestion_paused: isPaused,
	} = thought;

	if (isPaused) {
		return;
	}

	if (!contentMd) {
		throw new Error("No content_md");
	}

	const contentOrDiff = lastContentMd ? jsdiff.createPatch("note", lastContentMd, contentMd) : contentMd;
	if (lastContentMd) {
		const diffIsSignificant = await checkIfDiffIsSignificant({ diffString: contentOrDiff });

		console.log(`Diff is significant: ${diffIsSignificant}`);

		if (!diffIsSignificant) {
			console.log(`Content change not significant`);
			return;
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

	LangfuseExporter.langfuse?.flushAsync();

	return;
};
