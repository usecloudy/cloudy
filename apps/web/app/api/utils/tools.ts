import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateObject, tool } from "ai";
import { z } from "zod";

import { heliconeOpenAI } from "./helicone";

export const makeSuggestEditPrompts = ({
	instructions,
	example,
	content,
}: {
	instructions: string;
	example: string;
	content: string;
}): CoreMessage[] => [
	{
		role: "user",
		content: `The below note, which is in html format, is the current version:
------
${content}
------

The instructions to edit the note are:
------
${instructions}
------

Content to write:
------
${example}
------

Output the new version of the note including the content to write in the same format.`,
	},
];

interface EditInstruction {
	instructions: string;
	content: string;
}

export const makeSuggestEditTool = (thoughtContentHtml: string, heliconeHeaders: Record<string, string>) => {
	const edits: EditInstruction[] = [];

	const applyEdit = async ({ instructions, content }: EditInstruction) => {
		const { object: newContent } = await generateObject({
			model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", {
				structuredOutputs: true,
			}),
			messages: makeSuggestEditPrompts({
				instructions,
				example: content,
				content: thoughtContentHtml,
			}),
			schema: z.object({
				newContent: z.string().describe("The new content of the note"),
			}),
			temperature: 0.0,
			headers: heliconeHeaders,
		});

		return newContent.newContent;
	};

	const applyEdits = async () => {
		if (edits.length === 0) {
			return thoughtContentHtml;
		}

		if (edits.length > 1) {
			console.log("Multiple edits");
		}

		return applyEdit(edits[0]!);
	};

	return {
		edits,
		applyEdits,
		tool: tool({
			description: `Suggest edits to the note. These instructions will be provided to an assistant that can edit the note. Do not mention this function in your response to the user.
	- If the user is asking you to reorganize the note, make sure you do it extensively while keeping the original meaning, language, and structure of the note.`,
			parameters: z.object({
				instructions: z.string().describe("Provide EXACT instructions on how to edit the note"),
				content: z.string().describe("The write out the EXACT content you are suggesting."),
			}),
			execute: async (edit: EditInstruction) => {
				edits.push(edit);
				return "successfully scheduled edit";
			},
		}),
	};
};
