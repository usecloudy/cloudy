import { trace } from "@opentelemetry/api";
import { Database } from "@repo/db";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import { heliconeOpenAI } from "app/api/utils/helicone";

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

export const generateComments = async ({
	contextText,
	thoughtText,
	thoughtDiffText,
	intentText,
	comments,
	heliconeHeaders,
}: {
	contextText: string;
	thoughtText: string;
	thoughtDiffText: string;
	intentText: string;
	comments: Comment[];
	heliconeHeaders: Record<string, string>;
}) => {
	const commentsToArchive: string[] = [];
	const commentsToAdd: z.infer<typeof IdeaCommentSchema>[] = [];

	await trace.getTracer("ai").startActiveSpan("generate-comments", async () => {
		const messages = makeThoughtIdeatePrompts({
			contextText,
			thoughtText,
			thoughtDiffText,
			intentText,
			comments: comments.map(comment => ({
				id: comment.id,
				content: comment.content!,
				targets: comment.related_chunks!,
			})),
		});

		const { text } = await generateText({
			model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
			messages,
			experimental_telemetry: { isEnabled: true, functionId: "thought-ideate" },
			headers: {
				...heliconeHeaders,
				"Helicone-Session-Path": "thought-ideate/ideate",
			},
		});

		if (text.includes("<NO_ACTION>")) {
			console.log(`No action taken`);
			return {
				commentsToArchive: [],
				commentsToAdd: [],
			};
		}

		const { object: response } = await generateObject({
			model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
			schema: ResponseSchema,
			messages: [{ role: "user", content: `<response>\n${text}\n</response>\n\nFormat the above response in JSON.` }],
			experimental_telemetry: { isEnabled: true, functionId: "thought-ideate-generate-comments" },
			headers: {
				...heliconeHeaders,
				"Helicone-Session-Path": "thought-ideate/format",
			},
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

export const checkIfDiffIsSignificant = async (diffString: string, heliconeHeaders: Record<string, string>) => {
	const { object: response } = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
		schema: z.object({
			diffIsSignificant: z.boolean(),
			isComplete: z.boolean(),
		}),
		messages: makeThoughtIdeateDiffChangePrompts({ diffString }),
		temperature: 0,
		experimental_telemetry: { isEnabled: true, functionId: "thought-ideate-generate-comments" },
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "thought-ideate/diff-change",
		},
	});

	return response;
};
