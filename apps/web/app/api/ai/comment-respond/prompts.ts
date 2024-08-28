import { CoreMessage } from "ai";

import { MarkdownChunk } from "app/api/utils/relatedChunks";
import { thoughtToPrompt } from "app/api/utils/thoughts";

export const makeCommentRespondPrompts = ({
	relatedChunks,
	thought,
}: {
	relatedChunks: MarkdownChunk[];
	thought: { title?: string | null; contentMd: string };
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing ideation tool that helps users think through problems and ideas, asks the right questions, and makes actionable suggestions.

You must answer in a friendly, helpful, and short & concise manner.

You are provided with a tool to edit the note when needed. You should use it frequently to show the user how to improve/incorporate changes to their note.
- Prefer using the tool to suggest rather than only providing instructions/examples.
- You must not mention this function/tool in your response to the user.`,
	},
	{
		role: "user",
		content: `Below are some relevant notes I've previously written:
${relatedChunks.map(chunk => `<note>\n${chunk.chunk}\n</note>`).join("\n")}

I'm currently in the process of writing the below note:
${thoughtToPrompt(thought)}`,
	},
];
