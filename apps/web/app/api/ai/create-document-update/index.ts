import {
	ChatRole,
	ChatThreadType,
	extractInnerTextFromXml,
	extractMultipleInnerTextFromXml,
	fixOneToOne,
	handleSupabaseError,
} from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, generateObject, generateText } from "ai";
import { randomUUID } from "crypto";
import { z } from "zod";

import { heliconeAnthropic, heliconeOpenAI, makeHeliconeHeaders } from "app/api/utils/helicone";
import { getCommitPrompt, getFileContentsPrompt } from "app/api/utils/repoContext";
import { getContextForThought } from "app/api/utils/thoughts";

const makeDocumentUpdateSuggestionPrompts = ({
	filesText,
	contextText,
	commitText,
	documentContent,
	documentTitle,
}: {
	filesText?: string;
	contextText?: string;
	commitText: string;
	documentContent?: string | null;
	documentTitle?: string | null;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing ideation tool that helps users write technical documents.

${
	filesText
		? `Below are the contents of the files referenced in the document, use this as context:
${filesText}`
		: ""
}
${contextText}
The user working on the below document.
You are able to make suggestions to update the document. To make a suggestion, you MUST wrap your suggestion in a <suggestion></suggestion> tag, and provide the original content and your new suggestion, for example:

# EXAMPLES:

## Example 1:
<suggestion>
<reasoning>
The package name was changed from \`original_package\` to \`new_package\`, so we need to update the installation instructions.
</reasoning>
<selected_snippet>
# Installation
\`\`\`bash
npm install @team/original_package
\`\`\`
</selected_snippet>
<replacement_snippet>
# Installation
\`\`\`bash
npm install @team/new_package
\`\`\`
</replacement_snippet>
</suggestion>

## Example 2:
<suggestion>
<reasoning>
The get method has been removed from the package, so we need to remove anything related to the get method.
</reasoning>
<selected_snippet>
## How to use the get method
\`\`\`python
from @team/original_package import get

get()
\`\`\`
</selected_snippet>
<replacement_snippet></replacement_snippet> # Empty opening/closing tags to delete the lines
</suggestion>

When making large edits, prefer to use multiple <suggestion></suggestion> tags, rather than one large suggestion.`,
	},
	{
		role: "user",
		content: `Below is the document the user is writing:
<document${documentTitle ? ` title="${documentTitle}"` : ""}>
${documentContent}
</document>

The following commit was made to the repository:
${commitText}

Suggest edits to the document only for the purpose of updating the document. If there are no edits to be made, don't return any suggestions.
- Don't make suggestions to the document title, only to the content.`,
	},
];

type DocumentUpdateSuggestPayload = {
	documentUpdateId: string;
	installationId: string;
	repoOwner: string;
	repoName: string;
};

export const createDocumentUpdate = async (payload: DocumentUpdateSuggestPayload, supabase: SupabaseClient<Database>) => {
	const documentUpdate = handleSupabaseError(
		await supabase
			.from("document_updates")
			.select("*, document:thoughts!document_id(id, workspace_id, content_md, title)")
			.eq("id", payload.documentUpdateId)
			.single(),
	);

	const document = fixOneToOne(documentUpdate.document);

	if (!document) {
		throw new Error("Document not found");
	}

	const heliconeHeaders = makeHeliconeHeaders({
		workspaceId: document.workspace_id,
		sessionName: "Suggest Document Update",
		sessionId: `suggest-document-update/${randomUUID()}`,
	});

	const [filesText, contextText, commitText] = await Promise.all([
		getFileContentsPrompt(document.id, supabase),
		getContextForThought(document.id, document.workspace_id, supabase, {
			...heliconeHeaders,
			"Helicone-Session-Path": "document-update-suggest/context",
		}),
		getCommitPrompt(documentUpdate.commit_sha, payload.repoOwner, payload.repoName, payload.installationId),
	]);

	const { reasoning, documentNeedsUpdate } = await quickChangeCheck(document.content_md!, document.title!, commitText, {
		...heliconeHeaders,
		"Helicone-Session-Path": "document-update-suggest/quick-check",
	});

	if (!documentNeedsUpdate) {
		handleSupabaseError(
			await supabase
				.from("document_updates")
				.update({
					generation_completed_at: new Date().toISOString(),
				})
				.eq("id", payload.documentUpdateId),
		);

		return;
	}

	const llmMessages = makeDocumentUpdateSuggestionPrompts({
		filesText,
		contextText,
		commitText,
		documentContent: document.content_md,
		documentTitle: document.title,
	});

	let { text } = await generateText({
		// model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
		// model: heliconeOpenAI.languageModel("gpt-4o-mini"),
		model: heliconeAnthropic.languageModel("claude-3-5-sonnet-20241022"),
		messages: llmMessages,
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "document-update-suggest",
		},
	});

	let parsedSuggestions = parseSuggestions(text);

	if (!parsedSuggestions.length) {
		if (text.includes("<replacement_snippet>")) {
			console.log("Attempting second attempt");
			({ text } = await generateText({
				// model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
				// model: heliconeOpenAI.languageModel("gpt-4o-mini"),
				model: heliconeAnthropic.languageModel("claude-3-5-sonnet-20241022"),
				messages: llmMessages,
				temperature: 0.5,
				experimental_telemetry: {
					isEnabled: true,
				},
				headers: {
					...heliconeHeaders,
					"Helicone-Session-Path": "document-update-suggest/attempt-2",
				},
			}));
			parsedSuggestions = parseSuggestions(text);

			if (!parsedSuggestions.length) {
				console.log("Second attempt failed");
				return;
			}
		} else {
			console.log("First attempt failed, but no <replacement_snippet> found");
			return;
		}
	}

	const chatThread = handleSupabaseError(
		await supabase
			.from("chat_threads")
			.insert({
				document_update_id: payload.documentUpdateId,
				type: ChatThreadType.DocumentUpdate,
				workspace_id: document.workspace_id,
				document_id: document.id,
			})
			.select("id")
			.single(),
	);

	handleSupabaseError(
		await supabase.from("chat_messages").insert([
			{
				thread_id: chatThread.id,
				role: ChatRole.Assistant,
				content: reasoning,
				completed_at: new Date().toISOString(),
				created_at: new Date().toISOString(),
			},
			...parsedSuggestions.map((parsedSuggestion, i) => {
				const date = new Date(Date.now() + i + 1).toISOString();
				return {
					thread_id: chatThread.id,
					role: ChatRole.Assistant,
					content: makeChatMessageForUpdate(parsedSuggestion),
					completed_at: date,
					created_at: date,
				};
			}),
		]),
	);

	handleSupabaseError(
		await supabase
			.from("document_updates")
			.update({
				generation_completed_at: new Date().toISOString(),
			})
			.eq("id", payload.documentUpdateId),
	);
};

const quickChangeCheck = async (
	documentContent: string,
	documentTitle: string,
	commitText: string,
	heliconeHeaders: Record<string, string>,
) => {
	const { object } = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
		schema: z.object({
			reasoning: z.string().describe("The reasoning for whether the document needs an update"),
			documentNeedsUpdate: z.boolean().describe("Whether the document needs an update"),
		}),
		temperature: 0.0,
		prompt: `Below is the document the user is writing:
<document${documentTitle ? ` title="${documentTitle}"` : ""}>
${documentContent}
</document>

The following commit was made to the repository:
${commitText}

Do the changes in the commit affect the document by making anything there out of date? Return a boolean value whether changes are needed to the document.`,
		headers: heliconeHeaders,
	});

	return object;
};

export const parseSuggestions = (text: string) => {
	const suggestionBlocks = extractMultipleInnerTextFromXml(text, "suggestion");

	return suggestionBlocks.flatMap(suggestion => {
		if (!suggestion) return [];

		const reasoning = extractInnerTextFromXml(suggestion, "reasoning", { trim: true });
		const selectedSnippet = extractInnerTextFromXml(suggestion, "selected_snippet", { trim: true });
		const replacementSnippet = extractInnerTextFromXml(suggestion, "replacement_snippet", { trim: true });

		if (!reasoning || !selectedSnippet || !replacementSnippet) return [];

		return [
			{
				reasoning,
				selectedSnippet,
				replacementSnippet,
			},
		];
	});
};

type ParsedSuggestion = ReturnType<typeof parseSuggestions>[number];

const makeChatMessageForUpdate = (parsedSuggestion: ParsedSuggestion) => {
	return `${parsedSuggestion.reasoning}
\`\`\`
<original_content>
${parsedSuggestion.selectedSnippet}
</original_content>
<replacement_content>
${parsedSuggestion.replacementSnippet}
</replacement_content>
\`\`\``;
};
