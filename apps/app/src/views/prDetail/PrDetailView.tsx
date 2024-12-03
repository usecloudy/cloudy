import { makeDocPath, makeGithubPrUrl } from "@cloudy/utils/common";
import { ExternalLinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspace } from "src/stores/workspace";

import { useProject } from "../projects/ProjectContext";
import { DocumentCard } from "./DocumentCard";
import { usePrDetail } from "./hooks";

export const PrDetailView = () => {
	const workspace = useWorkspace();
	const project = useProject();
	const { data: prData, isLoading } = usePrDetail();
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (!prData || !prData.repo) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-y-4">
				<p className="text-gray-600">Pull request not found</p>
				<Button onClick={() => navigate(-1)}>Go Back</Button>
			</div>
		);
	}

	const documentDrafts = prData.document_pr_drafts;

	return (
		<div className="w-full px-16 py-8">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold">Docs Drafted for Pull Request</h1>
				<a
					className="flex flex-row items-center gap-1 text-accent hover:underline active:opacity-80"
					href={makeGithubPrUrl(prData.repo.owner, prData.repo.name, prData.pr_number)}>
					<span>
						{prData.repo.owner}/{prData.repo.name} #{prData.pr_number}
					</span>
					<ExternalLinkIcon className="size-4" />
				</a>
			</div>
			{documentDrafts.length === 0 ? (
				<div className="rounded-lg border border-gray-200 p-8 text-center">
					<p className="text-secondary">No document drafts found in this pull request</p>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					{documentDrafts.map(draft => (
						<Link
							key={draft.id}
							to={makeDocPath({
								workspaceSlug: workspace!.slug,
								projectSlug: project!.slug,
								documentId: draft.document!.id,
							})}>
							<DocumentCard documentDraft={draft} />
						</Link>
					))}
				</div>
			)}
		</div>
	);
};
