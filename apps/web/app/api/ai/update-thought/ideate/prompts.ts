import { CoreMessage } from "ai";

interface Comment {
	id: string;
	content: string;
	targets: string[];
}

export interface LinkedThought {
	id: string;
	title: string | null;
	contentMd: string | null;
}

export const makeThoughtIdeatePrompts = ({
	contextText,
	thoughtText,
	thoughtDiffText,
	intentText,
	comments,
}: {
	contextText: string;
	thoughtText: string;
	thoughtDiffText: string;
	intentText: string;
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

	return [
		{
			role: "system",
			content: `You are a friendly and helpful assistant that helps users ideate, think through ideas, and better reflect on their notes. Respond in a friendly, concise manner. Talk to the user in your comments. Your goal is to nudge their thought process in the right direction.`,
		},
		{
			role: "user",
			content: `${contextText}The user is currently in the process of writing the below note, a diff has been provided to show the changes. Focus your new comments on what the user has recently written:
${thoughtText}${thoughtDiffText}${intentText}

${commentsText}

Ask questions and provide constructive criticism on what the user is writing about as a writing assistant.
- Focus on the current note, using previous notes only as reference.
- Ensure all responses are in the same language as the note and concise.
- For each comment:
  - Mark with the appropriate type: 'comment', 'action', 'suggestion', 'idea', or 'question'.
  - Clearly include the piece of the note being commented on.
  - Keep comments short, concise, and to the point.
- Ask clarifying questions to understand the user's perspective and help them ideate.
- Suggest edits and improvements, especially if the note is disorganized or unfocused.
- Provide next steps/actions if applicable.
- Focus on improving ideation, creativity, and critical thinking over writing for other readers.
- Maintain a reasonable number of active comments (5-10 maximum) to avoid overwhelming the user.
- Adjust the number of comments based on the amount of content changed:
  - For a single sentence change, make 1 comment.
  - For multiple paragraph changes, make up to 3 comments.
- Archive any comments that are no longer applicable to the current version of the note.
- Ensure new comments are not redundant with existing or other new comments.
- When archiving a comment, provide a brief explanation for why it's no longer relevant.
- If there are no comments to add or archive, respond ONLY with "<NO_ACTION>"

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
Given the below diff, determine whether the diff is a significant change to the note or not, also determine if the writing is complete:
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
{ "diffIsSignificant": true, "isComplete": true }
------
Given the below diff, determine whether the diff is a significant change to the note or not, also determine if the writing is complete:
---
Index: note
===================================================================
--- note
+++ note
@@ -4,8 +4,9 @@
 
-Ok so I am thinking about how to make the todo app better.
+Ok so I am reasoning about how how I can make the app better.
---
{ "diffIsSignificant": false, "isComplete": true }
------
Given the below diff, determine whether the diff is a significant change to the note or not, also determine if the writing is complete:
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
{ "diffIsSignificant": false, "isComplete": false }
------
Given the below diff, determine whether the diff is a significant change to the note or not, also determine if the writing is complete:
---
Index: note
===================================================================
--- note
+++ note
@@ -4,8 +4,9 @@

+Ok so I am reasoning about how I
---
{ "diffIsSignificant": false, "isComplete": false }
------
Given the below diff, determine whether the diff is a significant change to the note or not, also determine if the writing is complete:
---
${diffString}
---`,
	},
];
