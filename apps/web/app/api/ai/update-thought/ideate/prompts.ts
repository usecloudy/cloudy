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
			"Currently, the below are comments you previously provided on the note before the current change:\n" +
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
			content: `You are a friendly and helpful assistant that helps users ideate, think through ideas, and better reflect on their notes. Respond in a friendly, concise manner. Talk to the user in your summaries.`,
		},
		{
			role: "user",
			content: `${relatedChunksText}The user is currently in the process of writing the below note, a diff has been provided to show the changes. Focus your new comments on what the user has recently written:
${thoughtToPrompt(thought)}${thoughtIntentToPrompt(thought.intent)}

${commentsText}

Ask questions and provide constructive criticism on what the user is writing about as a writing assistant.
- Make sure all your responses are in the same language as the note and concise.
- Ask clarifying questions to understand the user's perspective and help them ideate.
- Suggest edits and improvements to the note. For example, If the note is disorganized or not focused, suggest edits to improve it.
- Provide next steps/actions if applicable.
- Mark each new comment with the appropriate type: 'comment', 'action', 'suggestion', 'idea', or 'question'.
- For each comment, clearly include the piece of the note that you are commenting on.
- Focus on the current note, use the previous notes as reference but only comment on the current note.
- Make sure you keep the comments short, concise, and to the point.
- Focus on improving ideation, creativity, and critical thinking over writing for other readers.
- To not overwhelm the user, make sure at most 5-10 comments are active at a time.
- Make a reasonable amount of comments given the amount of content changed, for example, if 1 sentence is changed, make 1 comment, if multiple paragraphs are changed, make 3 comments.
- If there are no comments to add or archive, say ONLY "<NO_ACTION>"

An example of a comment is:
**Suggestion**
Commenting on: "I am thinking about how to make the todo app better."
Comment: "I think they're very loud and will alert the rest of the company."

Make sure you think step by step before responding. Also make sure each comment you provide is insightful and impactful.

${tasksText}`,
		},
	];
};

export const makeThoughtIdeateSelectionPrompts = ({
	relatedChunks,
	thought,
	comments,
}: {
	relatedChunks: MarkdownChunk[];
	thought: {
		title?: string | null;
		contentWithSelection: string;
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
			content: `You are a friendly and helpful assistant that helps users ideate, think through ideas, and better reflect on their notes. Respond in a friendly, concise manner. Talk to the user in your summaries.`,
		},
		{
			role: "user",
			content: `${relatedChunksText}The user is currently in the process of writing the below note, a diff has been provided to show the changes. The user has selected a section of the note to edit, focus your new comments on that selection. The selection is marked with the [[[ and ]]] tags, for example, in the following text: "Hi [[[user]]] I'm doing well", the selection is "user".
${thoughtToPrompt({ title: thought.title, contentMd: thought.contentWithSelection })}${thoughtIntentToPrompt(thought.intent)}

${commentsText}

Ask questions and provide constructive criticism on what the user is writing about as a writing assistant.
- Make sure all your responses are in the same language as the note and concise.
- Ask clarifying questions to understand the user's perspective and help them ideate.
- Suggest edits and improvements to the note. For example, If the note is disorganized or not focused, suggest edits to improve it.
- Provide next steps/actions if applicable.
- Mark each new comment with the appropriate type: 'comment', 'action', 'suggestion', 'idea', or 'question'.
- For each comment, clearly include the piece of the note that you are commenting on.
- Focus on the current note, use the previous notes as reference but only comment on the current note.
- Make sure you keep the comments short, concise, and to the point.
- Focus on improving ideation, creativity, and critical thinking over writing for other readers.
- To not overwhelm the user, make sure only 5-10 comments are active at a time.
- If there are no comments to add or archive, say ONLY "<NO_ACTION>"

An example of a comment is:
**Suggestion**
Commenting on: "I am thinking about how to make the todo app better."
Comment: "I think they're very loud and will alert the rest of the company."

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
