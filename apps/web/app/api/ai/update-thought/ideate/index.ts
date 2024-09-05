import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import * as jsdiff from "diff";
import { LangfuseExporter } from "langfuse-vercel";

import { getRelatedChunkContentsForThought } from "app/api/utils/relatedChunks";
import { addSignal, removeSignal } from "app/api/utils/thoughts";

import { ThoughtRecord } from "../utils";
import { checkIfDiffIsSignificant, generateComments } from "./utils";

export const ideateThought = async (thought: ThoughtRecord, supabase: SupabaseClient<Database>) => {
	await addSignal(ThoughtSignals.AI_SUGGESTIONS, thought.id, supabase);
	try {
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
	} finally {
		await removeSignal(ThoughtSignals.AI_SUGGESTIONS, thought.id, supabase);
	}
};