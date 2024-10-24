import {
	ArrowLeftIcon,
	ArrowRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	CircleFadingArrowUp,
	FilePlusIcon,
	HomeIcon,
	SearchIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "src/components/Button";
import { FeedbackDropdown } from "src/components/Feedback";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { useUserRecord } from "src/stores/user";
import { useWorkspaceStore } from "src/stores/workspace";
import { useDebug } from "src/utils/debug";
import { pluralize } from "src/utils/strings";
import { useBreakpoint } from "src/utils/tailwind";
import { useCreateThought } from "src/utils/thought";
import { useCustomerStatus } from "src/utils/useCustomerStatus";

import { useSearchBarStore } from "../search/searchBarStore";
import { GenerateDoc } from "../thoughtDetail/GenerateDoc";
import { Collections } from "./Collections";
import { LatestThoughts } from "./LatestThoughts";
import { LibraryView } from "./LibraryView";
import { NewNote } from "./NewNote";
import { ProjectSelector } from "./ProjectSelector";
import { SidebarDropdown } from "./SidebarDropdown";
import { useSidebarContext } from "./SidebarProvider";
import { WorkspaceSelector } from "./WorkspaceSelector";

const minimalSidebarRoutePaths = ["/workspaces/new/setup", "/auth/invite-accept", "/auth/complete-account-setup"];

export const SidebarView = () => {
	const debug = useDebug();
	const isMdBreakpoint = useBreakpoint("md");
	const isMobile = !isMdBreakpoint;

	const userRecord = useUserRecord();
	const workspace = useWorkspaceStore(s => s.workspace);
	const { setIsOpen: setIsSearchBarOpen } = useSearchBarStore();

	const { data } = useCustomerStatus();
	const customerStatus = data?.customerStatus;

	const createThoughtMutation = useCreateThought();

	const location = useLocation();
	const isMinimalSidebar = minimalSidebarRoutePaths.includes(location.pathname);

	const { isSidebarCollapsed, setIsSidebarCollapsed, isMobileSidebarOpen } = useSidebarContext();

	if (isMobile && !isMobileSidebarOpen) {
		return null;
	}

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
									<Button onClick={() => createThoughtMutation.mutate({})} variant="ghost" size="icon">
										<FilePlusIcon className="size-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>New doc</TooltipContent>
							</Tooltip>
						)}
						{workspace && (
							<Tooltip>
								<TooltipTrigger>
									<Button onClick={() => setIsSearchBarOpen(true)} variant="ghost" size="icon">
										<SearchIcon className="size-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Search for notes</TooltipContent>
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
						<ProjectSelector />
						{workspace && (
							<div className="mt-4 flex items-center gap-1 px-4">
								<NewNote />
								<GenerateDoc />
							</div>
						)}
						<div className="no-scrollbar mt-4 flex flex-1 flex-col gap-4 overflow-y-auto px-4">
							<Button
								variant="secondary"
								className="w-full justify-start border border-border text-sm font-medium text-secondary hover:bg-card/50 hover:text-secondary"
								onClick={() => setIsSearchBarOpen(true)}>
								<SearchIcon className="size-4" />
								<span>Search</span>
							</Button>
							<LibraryView />
							{/* <LatestThoughts /> */}
							{/* <Collections /> */}
							<div className="h-4" />
						</div>
					</>
				)}
				{debug && <div className="mb-4 px-4 text-xs text-secondary">Debug is enabled</div>}
				<div className="flex w-full flex-col gap-2 px-4 py-2">
					<div className="hidden w-full flex-col items-stretch md:flex">
						<FeedbackDropdown />
					</div>
					{customerStatus?.isTrialing && (
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
					)}
				</div>
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
