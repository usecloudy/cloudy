import { CoreMessage } from "ai";

export const makeTitleSuggestionPrompts = ({
	contextText,
	currentContentMd,
}: {
	contextText: string;
	currentContentMd: string;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are a friendly and helpful assistant that helps users ideate, think through ideas, and better reflect on their notes. Respond in a friendly, concise manner. Talk to the user in your summaries."`,
	},
	{
		role: "user",
		content: `${contextText}I'm currently in the process of writing the below note:
<note>
${currentContentMd}
</note>

Suggest a meaningful title for this note. Make sure the title is concise, meaningful, and matches the tone of the user's writing.`,
	},
];
