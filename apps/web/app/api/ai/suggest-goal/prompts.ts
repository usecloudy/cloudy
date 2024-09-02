import { CoreMessage } from "ai";

import { MarkdownChunk } from "app/api/utils/relatedChunks";

export const makeGoalSuggestionPrompts = ({
	relatedChunks,
	currentContentMd,
}: {
	relatedChunks: MarkdownChunk[];
	currentContentMd: string;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are a friendly and helpful assistant that helps users ideate, think through ideas, and better reflect on their goals. Respond in a friendly, concise manner. Talk to the user in your summaries."`,
	},
	{
		role: "user",
		content: `Below are some relevant notes I've previously written:
${relatedChunks.map(chunk => `<note>\n${chunk.chunk}\n</note>`).join("\n")}

I'm currently in the process of writing the below note:
<note>
${currentContentMd}
</note>

Suggest a concise goal for what I'm trying to accomplish.`,
	},
];
