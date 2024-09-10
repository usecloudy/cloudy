import { openai } from "@ai-sdk/openai";
import { trace } from "@opentelemetry/api";
import { Database } from "@repo/db";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { MarkdownChunk } from "app/api/utils/relatedChunks";

import { makeThoughtIdeateDiffChangePrompts, makeThoughtIdeatePrompts, makeThoughtIdeateSelectionPrompts } from "./prompts";

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

const AddOnlyResponseSchema = z.object({
	commentsToAdd: z.array(IdeaCommentSchema),
});

export const generateComments = async ({
	relatedChunksText,
	linkedThoughtsText,
	title,
	contentOrDiff,
	intent,
	comments,
}: {
	relatedChunksText: string;
	linkedThoughtsText: string;
	title?: string | null;
	contentOrDiff: string;
	intent?: string | null;
	comments: Comment[];
}) => {
	const commentsToArchive: string[] = [];
	const commentsToAdd: z.infer<typeof IdeaCommentSchema>[] = [];

	await trace.getTracer("ai").startActiveSpan("generate-comments", async () => {
		const messages = makeThoughtIdeatePrompts({
			relatedChunksText,
			linkedThoughtsText,
			thought: {
				title,
				contentMd: contentOrDiff,
				intent,
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

export const generateCommentsForSelection = async ({
	relatedChunks,
	title,
	contentWithSelection,
	intent,
	comments,
}: {
	relatedChunks: MarkdownChunk[];
	title?: string | null;
	contentWithSelection: string;
	intent?: string | null;
	comments: Comment[];
}) => {
	const commentsToAdd: z.infer<typeof IdeaCommentSchema>[] = [];

	const messages = makeThoughtIdeateSelectionPrompts({
		relatedChunks,
		thought: {
			title,
			contentWithSelection,
			intent,
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
		schema: AddOnlyResponseSchema,
		messages: [{ role: "user", content: `<response>\n${text}\n</response>\n\nFormat the above response in JSON.` }],
		experimental_telemetry: { isEnabled: true, functionId: "thought-ideate-generate-comments" },
	});

	response.commentsToAdd.forEach(comment => {
		commentsToAdd.push(comment);
	});

	return {
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
