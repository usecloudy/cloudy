import {
	PrStatus,
	RepositoryConnectionRecord,
	getLibraryItems,
	handleSupabaseError,
	makePrDraftUrl,
	makeSkipDocsUrl,
	zip,
} from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText, tool } from "ai";
import { z } from "zod";

import { getOctokitAppClient } from "app/api/utils/github";
import { heliconeAnthropic } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

export interface PullRequestDocsGenerationDetails {
	title: string;
	description: string;
	diffText: string;
}

const documentSchema = z.object({
	path: z
		.string()
		.describe('The path to the document within the library, for example "/folder1/Folder 2/Document title here"'),
	title: z.string().describe("The title of the document"),
	content: z.string().describe("The markdown contents of the document"),
});

type Document = z.infer<typeof documentSchema>;

const getLibraryAsPrompt = async (workspaceId: string, projectId: string, supabase: SupabaseClient<Database>) => {
	const libraryItems = await getLibraryItems({ workspaceId, projectId }, supabase);

	if (libraryItems.length === 0) {
		return `There currently isn't any existing documentation for this project.`;
	}

	return `The current structure of the documentation is as follows:

<documentation_structure>
${libraryItems.map(item => `- ${item.type} ID "${item.id.slice(0, 6)}": "${item.path!}"`).join("\n")}
</documentation_structure>`;
};

const makeSystemPrompt = () => {
	return `You are an expert at creating documentation for projects. You are able to create folders/paths and markdown documents.
- You can create documents in the root of the library ("/Document name") or in any subfolder: ("/path/to/folder/Document title here").
- You do not need to create a /docs folder, the root folder is already for docs.`;
};

const makePrDocsGenerationPrompt = async (
	payload: PullRequestDocsGenerationDetails,
	workspaceId: string,
	projectId: string,
	supabase: SupabaseClient<Database>,
) => {
	return `${await getLibraryAsPrompt(workspaceId, projectId, supabase)}

- You don't need to provide a h1 title again in the document contents, place the title in the title field.
	
Given the following pull request:

<pull_request>
<title>
${payload.title}
</title>
<description>
${payload.description}
</description>
<diff>
${payload.diffText}
</diff>
</pull_request>

Generate a draft of the documentation for the pull request. Use the tools as needed to create the documentation.`;
};

export const createDraftForPr = async (
	repositoryConnection: RepositoryConnectionRecord,
	pullRequestNumber: number,
	title: string,
	description: string | null,
	status: PrStatus,
	headRef: string,
	baseRef: string,
) => {
	const supabase = await getSupabase({ mode: "service", bypassAuth: true });
	const project = handleSupabaseError(
		await supabase.from("projects").select("id, workspaces(id, slug)").eq("id", repositoryConnection.project_id).single(),
	);
	const workspace = project.workspaces!;

	const octokit = getOctokitAppClient(repositoryConnection.installation_id);

	// Get the diff between base and head
	const comparison = await octokit.rest.repos.compareCommitsWithBasehead({
		owner: repositoryConnection.owner,
		repo: repositoryConnection.name,
		basehead: `${baseRef}...${headRef}`,
	});

	const diffText = comparison.data.files?.map(file => file.patch).join("\n\n") ?? "";

	// generateObject({
	//     model: heliconeOpenAI.languageModel('gpt-4o-mini-2024-07-18'),
	//     prompt: makePrDocsDecisionPrompt(diffText),
	//     schema: z.object({

	//     })
	// })

	// 1. Determine whether the pr needs any docs
	// 2. Generate the docs, we'll need to support as many pages as needed
	// 2.1. Also, ideally we get a folder structure for the docs
	// 3. Somehow we also make these docs only draft documents, that get deleted when the PR is closed and published when the PR is merged

	const documents: Document[] = [];

	const { text } = await generateText({
		model: heliconeAnthropic.languageModel("claude-3-5-haiku-20241022"),
		system: makeSystemPrompt(),
		prompt: await makePrDocsGenerationPrompt(
			{ title, description: description ?? "", diffText },
			workspace.id,
			project.id,
			supabase,
		),
		tools: {
			createDocument: tool({
				description: "Create a document",
				parameters: documentSchema,
				execute: async ({ path, title, content }) => {
					documents.push({ path, title, content });

					return "Document created";
				},
			}),
		},
		maxSteps: 8,
	});

	const documentIds = handleSupabaseError(
		await supabase
			.from("thoughts")
			.insert(
				documents.map(document => ({
					project_id: repositoryConnection.project_id,
					workspace_id: workspace.id,
					title: document.title,
					content_md: document.content,
				})),
			)
			.select("id"),
	);

	const prMetadata = handleSupabaseError(
		await supabase
			.from("pull_request_metadata")
			.insert({
				pr_number: pullRequestNumber,
				repository_connection_id: repositoryConnection.id,
				pr_status: status,
				project_id: repositoryConnection.project_id,
			})
			.select("id")
			.single(),
	);

	handleSupabaseError(
		await supabase
			.from("document_pr_drafts")
			.insert(
				zip(documents, documentIds).map(([document, { id: documentId }]) => ({
					pr_metadata_id: prMetadata.id,
					document_id: documentId,
					path: document.path,
				})),
			)
			.select("id"),
	);

	await octokit.rest.issues.createComment({
		owner: repositoryConnection.owner,
		repo: repositoryConnection.name,
		issue_number: pullRequestNumber,
		body: `👋 Looks like your changes could use some docs! ${documents.length > 1 ? `I've drafted **${documents.length} pages** for you.` : "I've drafted a page for you."}

[**📝 Confirm & edit on Cloudy**](${makePrDraftUrl("http://localhost:3000", {
			workspaceSlug: workspace.slug,
			projectSlug: repositoryConnection.project_id,
			prMetadataId: prMetadata.id,
		})})


[🚫 Skip docs for this PR](${makeSkipDocsUrl("http://localhost:3000", { prMetadataId: prMetadata.id })})`,
	});
};
