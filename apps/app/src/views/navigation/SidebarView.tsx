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
			<div className="hidden md:flex sticky top-0 w-16 h-screen py-4 gap-2 flex-col items-center justify-between border-r border-border">
				<div className="flex flex-col gap-2 w-full items-center">
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
								<Link to={makeThoughtUrl(workspace.slug, "new")} className="px-4 mt-4">
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
		<div className="hidden md:flex sticky top-0 w-64 h-screen py-2 flex-col border-r border-border">
			<div className="w-full flex flex-row px-4 gap-2 items-center justify-between mb-2">
				<div className="flex-row items-center flex">
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
							<ChevronsLeftIcon className="size-5" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Collapse sidebar</TooltipContent>
				</Tooltip>
			</div>
			<WorkspaceSelector />
			{workspace && (
				<Link to={makeThoughtUrl(workspace.slug, "new")} className="px-4 mt-4">
					<Button variant="outline" className="w-full justify-start">
						<FilePlusIcon className="size-4" />
						<span>New note</span>
					</Button>
				</Link>
			)}
			<div className="px-4 mt-4 flex-1 overflow-y-auto no-scrollbar">
				<LatestThoughts />
				<div className="mt-6">
					<Collections />
				</div>
				<div className="h-4" />
			</div>
			<div className="w-full flex flex-row items-center justify-between px-4 pb-2 pt-3 border-t border-border">
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
