import { ArrowLeftIcon, ArrowRightIcon, ChevronsLeftIcon, ChevronsRightIcon, FilePlusIcon, HomeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "react-use";

import { Button } from "src/components/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/Tooltip";
import { useUserRecord } from "src/stores/user";
import { useWorkspaceStore } from "src/stores/workspace";
import { makeThoughtUrl } from "src/utils/thought";

import { Collections } from "./Collections";
import { LatestThoughts } from "./LatestThoughts";
import { SidebarDropdown } from "./SidebarDropdown";
import { WorkspaceSelector } from "./WorkspaceSelector";

export const SidebarView = () => {
	const userRecord = useUserRecord();
	const workspace = useWorkspaceStore(s => s.workspace);

	const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("isSidebarCollapsed", false);

	if (isSidebarCollapsed) {
		return (
			<div className="sticky top-0 hidden h-screen w-16 flex-col items-center justify-between gap-2 border-r border-border py-2 md:flex">
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
				<SidebarDropdown />
			</div>
		);
	}

	return (
		<div className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border py-2 md:flex">
			<div className="mb-2 flex w-full flex-row items-center justify-between gap-2 px-4">
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
					<Button onClick={() => window.history.forward()} aria-label="Go forward" variant="ghost" size="icon">
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
			<div className="no-scrollbar mt-4 flex-1 overflow-y-auto px-4">
				<LatestThoughts />
				<div className="mt-6">
					<Collections />
				</div>
				<div className="h-4" />
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
	);
};
