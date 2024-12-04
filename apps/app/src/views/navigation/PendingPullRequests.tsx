import { PrStatus, handleSupabaseError, makePrDraftPath, makePrDraftUrl } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { GitMergeIcon, GitPullRequestArrowIcon, GitPullRequestClosedIcon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { prQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem } from "src/components/Dropdown";
import { HelpTooltip } from "src/components/HelpTooltip";
import { useWorkspace } from "src/stores/workspace";
import { useDeletePrDrafts } from "src/utils/prDrafts";

import { useProject } from "../projects/ProjectContext";
import { CategoryHeader } from "./SidebarCategoryHeader";

export const useOpenPrs = () => {
	const project = useProject();

	return useQuery({
		queryKey: prQueryKeys.prs(),
		queryFn: async () => {
			return handleSupabaseError(
				await supabase
					.from("pull_request_metadata")
					.select(
						"id, pr_number, pr_status, repo:repository_connections(owner,name), document_pr_drafts(*, document:thoughts!document_id(id, title, content_md))",
					)
					.eq("project_id", project!.id),
			);
		},
		enabled: Boolean(project),
	});
};

const PrListItem = ({ pr, workspace, project }: { pr: any; workspace: any; project: any }) => {
	const deletePrDraftsMutation = useDeletePrDrafts();
	const iconForStatus = {
		[PrStatus.OPEN]: <GitPullRequestArrowIcon className="size-4" />,
		[PrStatus.MERGED]: <GitMergeIcon className="size-4" />,
		[PrStatus.CLOSED]: <GitPullRequestClosedIcon className="size-4" />,
	};

	return (
		<Link
			key={pr.id}
			to={makePrDraftPath({
				workspaceSlug: workspace?.slug,
				projectSlug: project?.slug,
				prMetadataId: pr.id,
			})}>
			<div className="group/item flex w-full items-center gap-1 rounded px-2 py-1 text-sm hover:bg-card">
				{iconForStatus[pr.pr_status as PrStatus]}
				<span className="flex-1 truncate">{`${pr.repo!.owner}/${pr.repo!.name} #${pr.pr_number}`}</span>
				<Dropdown
					trigger={
						<div>
							<Button
								variant="ghost"
								size="icon-xs-overflow"
								className="hidden size-5 shrink-0 rounded-sm hover:bg-border group-hover/item:flex">
								<MoreHorizontalIcon className="size-4" />
							</Button>
						</div>
					}>
					<DropdownItem onSelect={() => deletePrDraftsMutation.mutate({ prMetadataId: pr.id })}>
						<TrashIcon className="size-4" />
						<span>Delete docs for PR</span>
					</DropdownItem>
				</Dropdown>
			</div>
		</Link>
	);
};

export const PendingPullRequests = () => {
	const workspace = useWorkspace();
	const project = useProject();
	const { data } = useOpenPrs();

	if (!project) {
		return null;
	}

	const prsByStatus =
		data?.reduce(
			(acc: Record<PrStatus, typeof data>, pr) => {
				const status = pr.pr_status as PrStatus;
				if (!acc[status]) {
					acc[status] = [];
				}
				acc[status].push(pr);
				return acc;
			},
			{} as Record<PrStatus, typeof data>,
		) ?? ({} as Record<PrStatus, typeof data>);

	const orderedStatuses = [PrStatus.OPEN, PrStatus.MERGED, PrStatus.CLOSED];
	const statusLabels = {
		[PrStatus.OPEN]: "Open",
		[PrStatus.MERGED]: "Merged",
		[PrStatus.CLOSED]: "Closed",
	};

	const isEmpty = Object.values(prsByStatus).every(prs => !prs || prs.length === 0);

	return (
		<div className="flex w-full flex-col gap-2">
			<CategoryHeader title="Pull Requests">
				<HelpTooltip content="Cloudy will automatically create docs for your pull requests." />
			</CategoryHeader>
			<div className="flex flex-col gap-2">
				{isEmpty ? (
					<div className="rounded border border-dashed border-border p-2 text-xs text-tertiary">
						Your pull requests will show up here once you create them.
					</div>
				) : (
					orderedStatuses.map(
						status =>
							prsByStatus[status] &&
							prsByStatus[status].length > 0 && (
								<div key={status} className="flex flex-col gap-1">
									<div className="px-2 text-xs font-medium text-tertiary">{statusLabels[status]}</div>
									{prsByStatus[status]?.map(pr => (
										<PrListItem key={pr.id} pr={pr} workspace={workspace} project={project} />
									))}
								</div>
							),
					)
				)}
			</div>
		</div>
	);
};
