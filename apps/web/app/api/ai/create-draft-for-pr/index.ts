import {
	LibraryItem,
	PrDraftDocumentModificationType,
	PrStatus,
	RepositoryConnectionRecord,
	getLibraryItems,
	handleSupabaseError,
	makePrDraftUrl,
	makeSkipDocsUrl,
	zip,
} from "@cloudy/utils/common";
import { Database } from "@repo/db";
import * as Sentry from "@sentry/nextjs";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateObject, generateText, tool } from "ai";
import { z } from "zod";

import { getOctokitAppClient } from "app/api/utils/github";
import { heliconeAnthropic, heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";
import { getAppBaseUrl } from "app/api/utils/url";

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
	content: z.string().describe("The entire markdown contents of the document"),
	type: z.enum(["create", "edit"]).describe("Whether to create or edit an existing document"),
});

type DocumentEdit = z.infer<typeof documentSchema>;

const getDocumentAsPrompt = async (documentId: string, supabase: SupabaseClient<Database>) => {
	const document = handleSupabaseError(
		await supabase.from("thoughts").select("title, content_md").eq("id", documentId).single(),
	);

	return `<document>
<title>
${document.title}
</title>
<content>
${document.content_md}
</content>
</document>`;
};

const getLibraryAsPrompt = async (libraryItems: LibraryItem[]) => {
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
- You do not need to create a /docs folder, the root folder is already for docs.
- You have tools to view existing documents and to create/edit documents.

Create effective documentation for a whole project's codebase, not just for the pull request.`;
};

const makePrDocsGenerationPrompt = async (payload: PullRequestDocsGenerationDetails, libraryItems: LibraryItem[]) => {
	return `${await getLibraryAsPrompt(libraryItems)}

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

const makePrDocsDecisionPrompt = (payload: PullRequestDocsGenerationDetails) => {
	return `Given the following pull request, determine whether the pull request needs any docs.

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
</pull_request>`;
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
		await supabase
			.from("projects")
			.select("id, slug, workspaces(id, slug)")
			.eq("id", repositoryConnection.project_id)
			.single(),
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

	if (diffText.length > 60000) {
		await octokit.rest.issues.createComment({
			owner: repositoryConnection.owner,
			repo: repositoryConnection.name,
			issue_number: pullRequestNumber,
			body: `👋 Looks like your changes are too big to generate docs for, I'm skipping this PR. We're working on supporting larger diffs soon!`,
		});

		console.log("Diff text is too long, currently not supported");

		Sentry.captureMessage("Diff text is too long, currently not supported", {
			extra: {
				workspace,
				repositoryConnectionId: repositoryConnection.id,
				pullRequestNumber,
			},
		});

		return;
	}

	const {
		object: { needsDocs },
	} = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
		prompt: makePrDocsDecisionPrompt({ title, description: description ?? "", diffText }),
		schema: z.object({
			needsDocs: z.boolean().describe("Whether the pull request needs any docs"),
		}),
	});

	if (!needsDocs) {
		// Create a comment saying we don't need docs
		await octokit.rest.issues.createComment({
			owner: repositoryConnection.owner,
			repo: repositoryConnection.name,
			issue_number: pullRequestNumber,
			body: `👋 Looks like your changes don't need any docs, you're all clear!`,
		});

		console.log("No docs needed");

		return;
	}

	const libraryItems = await getLibraryItems({ workspaceId: workspace.id, projectId: project.id }, supabase);

	const libraryPathsToItems = Object.fromEntries(libraryItems.map(item => [item.path, item]));

	const documents: DocumentEdit[] = [];

	const { text } = await generateText({
		model: heliconeAnthropic.languageModel("claude-3-5-haiku-20241022"),
		system: makeSystemPrompt(),
		prompt: await makePrDocsGenerationPrompt({ title, description: description ?? "", diffText }, libraryItems),
		tools: {
			viewDocuments: tool({
				description: "View documents",
				parameters: z.object({
					paths: z.array(z.string()).describe("The paths to the documents within the library"),
				}),
				execute: async ({ paths }) => {
					return await Promise.all(
						paths.map(async path => {
							const item = libraryPathsToItems[path];

							if (!item) {
								return `Error: ${path} is not a valid path`;
							}

							if (item.type === "folder") {
								return `Error: ${item.path} is a folder, not a document`;
							}

							return await getDocumentAsPrompt(item.id, supabase);
						}),
					);
				},
			}),
			modifyDocument: tool({
				description: "Edit or create a document",
				parameters: documentSchema,
				execute: async ({ path, title, content, type }) => {
					if (type === "edit" && !libraryPathsToItems[path]) {
						return `Error: ${path} is not a valid path, cannot edit`;
					} else if (type === "create" && libraryPathsToItems[path]) {
						return `Error: ${path} is already a document, cannot create`;
					}

					documents.push({ path, title, content, type });

					return "Done";
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
					type: document.type as PrDraftDocumentModificationType,
					original_document_id: document.type === "create" ? null : libraryPathsToItems[document.path]!.id,
				})),
			)
			.select("id"),
	);

	await octokit.rest.issues.createComment({
		owner: repositoryConnection.owner,
		repo: repositoryConnection.name,
		issue_number: pullRequestNumber,
		body: `👋 Looks like your changes could use some docs! ${documents.length > 1 ? `I've drafted **${documents.length} pages** for you.` : "I've drafted a page for you."}

[**📝 Confirm & edit on Cloudy**](${makePrDraftUrl(getAppBaseUrl(), {
			workspaceSlug: workspace.slug,
			projectSlug: project.slug,
			prMetadataId: prMetadata.id,
		})})


[🚫 Skip docs for this PR](${makeSkipDocsUrl(getAppBaseUrl(), {
			workspaceSlug: workspace.slug,
			projectSlug: project.slug,
			prMetadataId: prMetadata.id,
		})})`,
	});
};
