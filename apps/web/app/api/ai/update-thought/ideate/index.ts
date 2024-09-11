import { ThoughtSignals, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import * as jsdiff from "diff";

import {
	addSignal,
	getLinkedThoughtsPromptDump,
	getRelatedThoughtsPromptDump,
	noteDiffToPrompt,
	removeSignal,
	thoughtIntentToPrompt,
	thoughtToPrompt,
} from "app/api/utils/thoughts";

import { ThoughtRecord } from "../utils";
import { checkIfDiffIsSignificant, generateComments } from "./utils";

export const ideateThought = async (
	thought: ThoughtRecord,
	supabase: SupabaseClient<Database>,
	options?: { force?: boolean },
) => {
	await addSignal(ThoughtSignals.AI_SUGGESTIONS, thought.id, supabase);
	try {
		const {
			id: thoughtId,
			content_md: contentMd,
			last_suggestion_content_md: lastContentMd,
			is_suggestion_paused: isPaused,
		} = thought;

		if (!options?.force && isPaused) {
			return;
		}

		if (!contentMd) {
			throw new Error("No content_md");
		}

		const heliconeHeaders = {
			"Helicone-User-Id": thought.author_id,
			"Helicone-Session-Name": "Ideate",
			"Helicone-Session-Id": `thought-ideate/${randomUUID()}`,
		};

		const contentOrDiff = lastContentMd ? jsdiff.createPatch("note", lastContentMd, contentMd) : contentMd;
		if (!options?.force && lastContentMd) {
			const diffIsSignificant = await checkIfDiffIsSignificant(contentOrDiff, heliconeHeaders);

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

		const { commentsToAdd, commentsToArchive } = await generateComments({
			linkedThoughtsText: await getLinkedThoughtsPromptDump(thoughtId, supabase),
			relatedChunksText: await getRelatedThoughtsPromptDump(thoughtId, supabase),
			thoughtText: thoughtToPrompt({ title: thought.title, contentMd }),
			thoughtDiffText: noteDiffToPrompt(contentOrDiff),
			intentText: thoughtIntentToPrompt(thought.user_intent),
			comments: existingComments,
			heliconeHeaders,
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

		return;
	} finally {
		await removeSignal(ThoughtSignals.AI_SUGGESTIONS, thought.id, supabase);
	}
};
