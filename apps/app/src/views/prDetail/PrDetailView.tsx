import { PrDocsStatus, PrStatus, makeDocPath, makeGithubPrUrl } from "@cloudy/utils/common";
import {
	BookCheckIcon,
	BookDashedIcon,
	ExternalLinkIcon,
	GitMergeIcon,
	GitPullRequestArrowIcon,
	GitPullRequestClosedIcon,
	XIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import LoadingSpinner from "src/components/LoadingSpinner";
import { useWorkspace } from "src/stores/workspace";
import { cn } from "src/utils";

import { useProject } from "../projects/ProjectContext";
import { DocumentCard } from "./DocumentCard";
import { useConfirmAllPrDocs, useDraftPrDocs, usePrDetail, useSkipPrDocs } from "./hooks";

export const PrDetailView = () => {
	const workspace = useWorkspace();
	const project = useProject();
	const { data: prData, isLoading } = usePrDetail();
	const navigate = useNavigate();

	const skipPrDocsMutation = useSkipPrDocs();
	const confirmAllPrDocsMutation = useConfirmAllPrDocs();
	const draftPrDocsMutation = useDraftPrDocs();

	const [searchParams, setSearchParams] = useSearchParams();
	const shouldSkipDocs = searchParams.get("shouldSkipDocs") === "true";

	useEffect(() => {
		if (shouldSkipDocs && prData) {
			skipPrDocsMutation.mutate({ prMetadataId: prData.id });

			const newSearchParams = new URLSearchParams(searchParams);
			newSearchParams.delete("shouldSkipDocs");
			setSearchParams(newSearchParams);
		}
	}, [shouldSkipDocs, skipPrDocsMutation, prData, searchParams, setSearchParams]);

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

	const iconForStatus = {
		[PrStatus.OPEN]: <GitPullRequestArrowIcon className="size-4" />,
		[PrStatus.MERGED]: <GitMergeIcon className="size-4" />,
		[PrStatus.CLOSED]: <GitPullRequestClosedIcon className="size-4" />,
	};

	const descriptionForPrDocsStatus = {
		[PrDocsStatus.DRAFT]:
			"Docs are being drafted for this pull request. Confirm or skip each doc's draft and they will be published automatically when the PR is merged.",
		[PrDocsStatus.PUBLISHED]: "Docs were generated and published for this pull request",
		[PrDocsStatus.SKIPPED]: "Docs are skipped for this pull request",
	};

	const buttonsForPrDocsStatus = {
		[PrDocsStatus.DRAFT]: (
			<>
				<Button variant="outline" onClick={() => skipPrDocsMutation.mutate({ prMetadataId: prData.id })}>
					<XIcon className="size-5" />
					Skip docs for this PR
				</Button>
				<Button onClick={() => confirmAllPrDocsMutation.mutate({ prMetadataId: prData.id })}>
					<BookCheckIcon className="size-5" />
					Confirm all
				</Button>
			</>
		),
		[PrDocsStatus.PUBLISHED]: null,
		[PrDocsStatus.SKIPPED]: (
			<Button onClick={() => draftPrDocsMutation.mutate({ prMetadataId: prData.id })}>
				<BookDashedIcon className="size-5" />
				Unskip docs for this PR
			</Button>
		),
	};

	return (
		<div className="mx-auto w-full max-w-screen-lg px-16 pb-8 pt-24">
			<div className="mb-6 flex flex-col gap-2">
				<div className="flex flex-row justify-between gap-2">
					<div className="flex flex-col gap-1">
						<h1 className="text-2xl font-semibold">Docs Drafted for Pull Request</h1>
						<a
							className="flex flex-row items-center gap-1 text-accent hover:underline active:opacity-80"
							href={makeGithubPrUrl(prData.repo.owner, prData.repo.name, prData.pr_number)}>
							{iconForStatus[prData.pr_status as PrStatus]}
							<span>
								{prData.repo.owner}/{prData.repo.name} #{prData.pr_number}
							</span>
							<ExternalLinkIcon className="size-4" />
						</a>
					</div>
					<div className="flex flex-row items-center gap-2 self-start">
						{buttonsForPrDocsStatus[prData.docs_status as PrDocsStatus]}
					</div>
				</div>
				<p className="text-sm text-secondary">{descriptionForPrDocsStatus[prData.docs_status as PrDocsStatus]}</p>
			</div>
			{documentDrafts.length === 0 ? (
				<div className="rounded-lg border border-gray-200 p-8 text-center">
					<p className="text-secondary">No document drafts found in this pull request</p>
				</div>
			) : (
				<div className={cn("flex flex-col gap-4", prData.docs_status === PrDocsStatus.SKIPPED && "opacity-50")}>
					{documentDrafts.map(draft => (
						<Link
							key={draft.id}
							to={makeDocPath({
								workspaceSlug: workspace!.slug,
								projectSlug: project!.slug,
								documentId: draft.document!.id,
							})}>
							<DocumentCard documentDraft={draft} disableButtons={prData.docs_status !== PrDocsStatus.DRAFT} />
						</Link>
					))}
				</div>
			)}
		</div>
	);
};
