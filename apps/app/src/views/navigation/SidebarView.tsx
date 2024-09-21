import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	CircleFadingArrowUp,
	CreditCardIcon,
	FilePlusIcon,
	HomeIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLocalStorage } from "react-use";

import { Button } from "src/components/Button";
import { FeedbackDropdown } from "src/components/Feedback";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { useUserRecord } from "src/stores/user";
import { useWorkspaceStore } from "src/stores/workspace";
import { pluralize } from "src/utils/strings";
import { makeThoughtUrl } from "src/utils/thought";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { Collections } from "./Collections";
import { LatestThoughts } from "./LatestThoughts";
import { SidebarDropdown } from "./SidebarDropdown";
import { useSidebarContext } from "./SidebarProvider";
import { WorkspaceSelector } from "./WorkspaceSelector";

const minimalSidebarRoutePaths = ["/workspaces/new/setup", "/auth/invite-accept", "/auth/complete-account-setup"];

export const SidebarView = () => {
	const userRecord = useUserRecord();
	const workspace = useWorkspaceStore(s => s.workspace);

	const { data } = useCustomerStatus();
	const customerStatus = data?.customerStatus;

	const location = useLocation();
	const isMinimalSidebar = minimalSidebarRoutePaths.includes(location.pathname);

	const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarContext();

	if (isSidebarCollapsed) {
		return (
			<div className="sticky top-0 hidden h-screen w-16 flex-col items-center justify-between gap-2 border-r border-border py-2 md:flex">
				{!isMinimalSidebar && (
					<div className="flex w-full flex-col items-center gap-2">
						<Button
							onClick={() => setIsSidebarCollapsed(false)}
							variant="ghost"
							size="icon"
							aria-label="Expand sidebar">
							<ChevronsRightIcon className="size-6" />
						</Button>
						<div className="hidden md:block">
							<Link to="/">
								<Button aria-label="Home" variant="ghost" size="icon">
									<HomeIcon className="size-5" />
								</Button>
							</Link>
						</div>
						{workspace && (
							<Tooltip>
								<TooltipTrigger>
									<Link to={makeThoughtUrl(workspace.slug, "new")} className="mt-4 px-4">
										<Button variant="ghost" size="icon">
											<FilePlusIcon className="size-5" />
										</Button>
									</Link>
								</TooltipTrigger>
								<TooltipContent>New note</TooltipContent>
							</Tooltip>
						)}
					</div>
				)}
				<SidebarDropdown />
			</div>
		);
	}

	return (
		<div className="relative h-full">
			<div className="absolute top-0 z-50 flex h-full w-screen flex-col overflow-hidden border-r border-border bg-background py-2 pt-4 md:sticky md:h-screen md:w-64 md:pt-2">
				{isMinimalSidebar ? (
					<div className="flex-1"></div>
				) : (
					<>
						<div className="mb-2 hidden w-full flex-row items-center justify-between gap-2 px-4 md:flex">
							<div className="flex flex-row items-center">
								<div className="hidden md:block">
									<Link to="/">
										<Button aria-label="Home" variant="ghost" size="icon">
											<HomeIcon className="size-5" />
										</Button>
									</Link>
								</div>
								<Button onClick={() => window.history.back()} aria-label="Go back" variant="ghost" size="icon">
									<ArrowLeftIcon className="size-5" />
								</Button>
								<Button
									onClick={() => window.history.forward()}
									aria-label="Go forward"
									variant="ghost"
									size="icon">
									<ArrowRightIcon className="size-5" />
								</Button>
							</div>
							<Tooltip durationPreset="short">
								<TooltipTrigger>
									<Button
										onClick={() => setIsSidebarCollapsed(true)}
										variant="ghost"
										size="icon"
										aria-label="Collapse sidebar">
										<ChevronsLeftIcon className="size-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Collapse sidebar</TooltipContent>
							</Tooltip>
						</div>
						<WorkspaceSelector />
						{workspace && (
							<Link to={makeThoughtUrl(workspace.slug, "new")} className="mt-4 px-4">
								<Button variant="outline" className="w-full justify-start">
									<FilePlusIcon className="size-4" />
									<span>New note</span>
								</Button>
							</Link>
						)}
						<div className="no-scrollbar mt-4 flex-1 gap-6 overflow-y-auto px-4">
							<LatestThoughts />
							<Collections />
							<div className="h-4" />
						</div>
					</>
				)}
				<div className="hidden w-full flex-col items-stretch px-4 md:flex">
					<FeedbackDropdown />
				</div>
				{customerStatus?.isTrialing && (
					<div className="px-4 py-2">
						<div className="flex flex-row items-center justify-between rounded bg-card px-3 py-2">
							<div className="flex flex-col">
								<span className="text-sm font-medium text-secondary">Trial Status</span>
								<span className="text-sm">
									{`${pluralize(customerStatus.remainingDaysInTrial ?? 0, "day")} remaining`}
								</span>
							</div>
							<Tooltip>
								<TooltipTrigger>
									<Link to={`/workspaces/${workspace?.slug}/settings`}>
										<Button variant="ghost" size="icon-sm" className="text-accent">
											<CircleFadingArrowUp className="size-5" />
										</Button>
									</Link>
								</TooltipTrigger>
								<TooltipContent>Upgrade plan</TooltipContent>
							</Tooltip>
						</div>
					</div>
				)}
				<div className="flex w-full flex-row items-center justify-between border-t border-border px-4 pb-2 pt-3">
					{userRecord && (
						<div className="flex flex-col">
							<span className="text-sm font-medium text-secondary">Signed in as</span>
							<span className="text-sm">{userRecord.email}</span>
						</div>
					)}
					<SidebarDropdown />
				</div>
			</div>
		</div>
	);
};
