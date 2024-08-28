import { openai } from "@ai-sdk/openai";
import { trace } from "@opentelemetry/api";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";

import { MarkdownChunk } from "app/api/utils/relatedChunks";
import { Database } from "app/db/database.types";

import { makeThoughtIdeateDiffChangePrompts, makeThoughtIdeatePrompts } from "./prompts";

type Comment = Database["public"]["Tables"]["thought_chats"]["Row"];

const IdeaCommentSchema = z.object({
	type: z.union([
		z.literal("comment"),
		z.literal("action"),
		z.literal("suggestion"),
		z.literal("idea"),
		z.literal("question"),
	]),
	targets: z.array(z.string()).describe("The target texts of the comment, this MUST only be in the current note."),
	content: z.string().describe("The content of the comment"),
});

const ArchiveSchema = z.object({
	commentId: z.string().describe("The uuid of the comment to archive"),
});

const ResponseSchema = z.object({
	commentsToArchive: z.array(ArchiveSchema),
	commentsToAdd: z.array(IdeaCommentSchema),
});

export const markThoughtAsProcessing = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	await supabase.from("thoughts").update({ suggestion_status: "processing" }).eq("id", thoughtId);
};

export const markThoughtAsIdle = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	await supabase.from("thoughts").update({ suggestion_status: "idle" }).eq("id", thoughtId);
};

export const generateComments = async ({
	relatedChunks,
	title,
	contentOrDiff,
	comments,
}: {
	relatedChunks: MarkdownChunk[];
	title?: string | null;
	contentOrDiff: string;
	comments: Comment[];
}) => {
	const commentsToArchive: string[] = [];
	const commentsToAdd: z.infer<typeof IdeaCommentSchema>[] = [];

	const tools: Record<string, any> = {
		archiveComment: tool({
			description: "Archive a comment",
			parameters: z.object({
				commentId: z.string().describe("The uuid of the comment to archive"),
			}),
			execute: async ({ commentId }) => {
				commentsToArchive.push(commentId);

				return `Archived comment ${commentId}`;
			},
		}),
		addComment: tool({
			description: "Add a comment",
			parameters: IdeaCommentSchema,
			execute: async newComment => {
				commentsToAdd.push(newComment);

				return `Added comment.`;
			},
		}),
	};

	if (comments.length === 0) {
		delete tools.archiveComment;
	}

	await trace.getTracer("ai").startActiveSpan("generate-comments", async () => {
		const messages = makeThoughtIdeatePrompts({
			relatedChunks,
			thought: {
				title,
				contentMd: contentOrDiff,
			},
			comments: comments.map(comment => ({
				id: comment.id,
				content: comment.content!,
				targets: comment.related_chunks!,
			})),
		});

		const { text } = await generateText({
			model: openai.languageModel("gpt-4o-2024-08-06"),
			messages,
			experimental_telemetry: { isEnabled: true, functionId: "thought-ideate" },
		});

		if (text.includes("<NO_ACTION>")) {
			console.log(`No action taken`);
			return {
				commentsToArchive: [],
				commentsToAdd: [],
			};
		}

		const { object: response } = await generateObject({
			model: openai.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
			schema: ResponseSchema,
			messages: [{ role: "user", content: `<response>\n${text}\n</response>\n\nFormat the above response in JSON.` }],
			experimental_telemetry: { isEnabled: true, functionId: "thought-ideate-generate-comments" },
		});

		response.commentsToArchive.forEach(comment => {
			commentsToArchive.push(comment.commentId);
		});

		response.commentsToAdd.forEach(comment => {
			commentsToAdd.push(comment);
		});
	});

	return {
		commentsToArchive,
		commentsToAdd,
	};
};

export const checkIfDiffIsSignificant = async ({ diffString }: { diffString: string }) => {
	console.log(diffString);
	const { object: response } = await generateObject({
		model: openai.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
		schema: z.object({
			diffIsSignificant: z.boolean(),
		}),
		messages: makeThoughtIdeateDiffChangePrompts({ diffString }),
		temperature: 0,
		experimental_telemetry: { isEnabled: true, functionId: "thought-ideate-generate-comments" },
	});

	return response.diffIsSignificant;
};
