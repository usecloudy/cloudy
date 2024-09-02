import { CoreMessage } from "ai";

import { MarkdownChunk } from "app/api/utils/relatedChunks";
import { thoughtIntentToPrompt, thoughtToPrompt } from "app/api/utils/thoughts";

interface Comment {
	id: string;
	content: string;
	targets: string[];
}

export const makeThoughtIdeatePrompts = ({
	relatedChunks,
	thought,
	comments,
}: {
	relatedChunks: MarkdownChunk[];
	thought: {
		title?: string | null;
		contentMd: string;
		intent?: string | null;
	};
	comments: Comment[];
}): CoreMessage[] => {
	let commentsText = "";
	let tasksText = "";
	if (comments.length > 0) {
		commentsText =
			"Currently, the below comments are on the note:\n" +
			comments
				.map(
					comment =>
						`<comment id="${comment.id}" targets="[${comment.targets?.join(", ") ?? ""}]">\n${
							comment.content
						}\n</comment>`,
				)
				.join("\n");

		tasksText = `\n\nYour task is to archive irrelevant comments and add new relevant comments.
- When archiving, make sure to include the id of the comment to archive
- Make sure you provide reasoning behind why you're archiving a comment or adding a new comment`;
	} else {
		tasksText =
			"Your task is to add new relevant comments.\n-Make sure you provide a reason why you're adding a new comment";
	}

	const relatedChunksText =
		relatedChunks.length > 0
			? `Below are some relevant notes the user has written, use this as context:
${relatedChunks.map(chunk => `<note>\n${chunk.chunk}\n</note>`).join("\n")}

`
			: "";

	return [
		{
			role: "system",
			content: `You are a friendly and helpful thought partner that helps users ideate, develop their ideas, and encourages them to take mental risks. Respond in a friendly, concise manner. Talk to the user in your summaries.`,
		},
		{
			role: "user",
			content: `${relatedChunksText}The user is currently in the process of writing the below note, a diff has been provided to show the changes. Focus your new comments on what the user has recently written:
${thoughtToPrompt(thought)}${thoughtIntentToPrompt(thought.intent)}

${commentsText}

Ask questions and provide constructive criticism on what the user is writing about.
- Make sure all your responses are to the point, in the same language as the note, and concise.
- Ask the user to clarify their goal if it's not clear.
- Suggest edits and improvements to the note. For example, If the note is disorganized or not focused, suggest edits to improve it.
- Provide next steps/actions if applicable.
- Mark each new comment with the appropriate type: 'comment', 'action', 'suggestion', 'idea', or 'question'.
- Focus on the current note, use the previous notes as reference but only comment on the current note.
- Focus on improving ideation, creativity, and critical thinking over writing for other readers.
- To not overwhelm the user, make sure only 5-10 comments are active at a time.
- Probe on questions the user asked to discern their intent.
- For critiques, start them with "How to..." or "What if...".
- Consider how different stakeholders would critique the note.
- If you have no comments to add or archive, say <NO_ACTION>
- comment on similar project, problems, and ideas companies have explored and what could be learned from them.

Make sure you think step by step before responding. Also make sure each comment you provide is insightful and impactful.

${tasksText}`,
		},
	];
};

export const makeThoughtIdeateDiffChangePrompts = ({ diffString }: { diffString: string }): CoreMessage[] => [
	{
		role: "user",
		content: `
Given the below diff, determine whether the diff is a significant change to the note or not:
---
Index: note
===================================================================
--- note
+++ note
@@ -4,8 +4,9 @@
 
 ## Questions to Consider:
 
 - What will be the effect of linking the neural implant directly to the todo app?
+- What will marketing think when they realize we've been tormenting the monkeys?
 
 ## Potential Effects and Challenges:
 
 - Technical implications: Consider the complexity of integrating neural technology with existing app frameworks.
---
{ "diffIsSignificant": true }
------
Given the below diff, determine whether the diff is a significant change to the note or not:
---
Index: note
===================================================================
--- note
+++ note
@@ -4,8 +4,9 @@
 
-Ok so I am thinking about how to make the todo app better.
+Ok so I am reasoning about how how I can make the app better.
---
{ "diffIsSignificant": false }
------
Given the below diff, determine whether the diff is a significant change to the note or not:
---
--- thought
+++ thought
@@ -1,9 +1,5 @@
 Daily log today:
 
 Damn, the monkeys are starting to become extremely rowdy today. I wonder how we should keep it quiet from the rest of the company.
 
-I think they're very loud and will alert the rest of the company.
-
-I think they're very loud and will alert the rest of the company.
-
 I think they're very loud and will alert the rest of the company.
---
{ "diffIsSignificant": false }
------
${diffString}
---`,
	},
];
