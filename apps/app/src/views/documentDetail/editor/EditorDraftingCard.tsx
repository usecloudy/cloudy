import { PrDraftDocumentStatus, makeGithubPrUrl, makePrDraftPath } from "@cloudy/utils/common";
import { ArrowLeftIcon, BookDashedIcon, ExternalLinkIcon, FileCheckIcon, XIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { DraftingButtons } from "src/components/prDrafts/DraftingButtons";
import { DraftingTitle } from "src/components/prDrafts/DraftingTitle";
import { useWorkspace } from "src/stores/workspace";
import { useProject } from "src/views/projects/ProjectContext";

import { useDocumentDraft } from "../drafting";

export const EditorDraftingCard = () => {
	const workspace = useWorkspace();
	const project = useProject();
	const { data: documentDraft } = useDocumentDraft();

	if (!documentDraft?.pull_request_metadata?.repo || !project) {
		return null;
	}

	const status = documentDraft.status as PrDraftDocumentStatus;

	const githubPrUrl = makeGithubPrUrl(
		documentDraft.pull_request_metadata.repo.owner,
		documentDraft.pull_request_metadata.repo.name,
		documentDraft.pull_request_metadata.pr_number,
	);

	const prNumberContent = (
		<a href={githubPrUrl} className="font-medium text-accent hover:underline">
			<span>#{documentDraft.pull_request_metadata.pr_number}</span>
			<ExternalLinkIcon className="mb-1 ml-1 inline-block size-4" />
		</a>
	);

	const textStates = {
		[PrDraftDocumentStatus.PUBLISHED]: <p>This doc is published and tied to pull request {prNumberContent}.</p>,
		[PrDraftDocumentStatus.DRAFT]: (
			<p>
				This doc is a draft tied to pull request {prNumberContent}. Hit confirm to publish it when the pull request gets
				merged.
			</p>
		),
		[PrDraftDocumentStatus.CONFIRMED]: (
			<p>
				This doc is confirmed to be published when pull request {prNumberContent}
				gets merged
			</p>
		),
		[PrDraftDocumentStatus.SKIPPED]: (
			<p>
				This doc is skipped and will not be published when pull request {prNumberContent}
				gets merged
			</p>
		),
	};

	return (
		<>
			<div className="mb-4">
				<Link
					to={makePrDraftPath({
						workspaceSlug: workspace.slug,
						projectSlug: project.slug,
						prMetadataId: documentDraft.pull_request_metadata.id,
					})}>
					<Button variant="ghost" size="sm">
						<ArrowLeftIcon className="size-4" />
						<span>Back to draft docs for PR #{documentDraft?.pull_request_metadata?.pr_number}</span>
					</Button>
				</Link>
			</div>
			<div className="flex flex-col gap-2 rounded-md border border-border p-4">
				<DraftingTitle documentDraft={documentDraft} />
				<div>{textStates[status]}</div>
				<div className="mt-2">
					<DraftingButtons documentDraft={documentDraft} />
				</div>
			</div>
		</>
	);
};
