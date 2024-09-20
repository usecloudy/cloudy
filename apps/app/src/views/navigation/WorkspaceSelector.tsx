import { CheckIcon, ChevronDownIcon, LayoutDashboardIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { Dropdown, DropdownItem, DropdownSeparator } from "src/components/Dropdown";
import { useAllUserWorkspaces } from "src/stores/user";
import { useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";

export const WorkspaceSelector = () => {
	const currentWorkspace = useWorkspaceStore(s => s.workspace);
	const { data: allUserWorkspaces } = useAllUserWorkspaces();

	if (!currentWorkspace) {
		return null;
	}

	return (
		<div className="flex items-center justify-between w-full gap-1 px-4">
			<Dropdown
				trigger={
					<Button variant="outline" className="flex justify-between items-center flex-1">
						<div className="flex flex-row items-center gap-2">
							<LayoutDashboardIcon className="size-4 text-secondary group-hover:text-accent" />
							<span>{currentWorkspace.name}</span>
						</div>
						<ChevronDownIcon className="size-4" />
					</Button>
				}>
				<div className="flex flex-col">
					{allUserWorkspaces?.map(workspace => (
						<Link to={`/workspaces/${workspace.slug}`} key={workspace.id}>
							<DropdownItem className={cn(workspace.id === currentWorkspace.id ? "bg-card/50" : "")}>
								{workspace.id === currentWorkspace.id ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<span className="w-4" />
								)}
								<span
									className={cn("flex-1 text-sm", workspace.id === currentWorkspace.id ? "font-medium" : "")}>
									{workspace.name}
								</span>
							</DropdownItem>
						</Link>
					))}
					<DropdownSeparator />
					<Link to="/workspaces/new">
						<DropdownItem className="text-accent hover:bg-accent/10">
							<PlusIcon className="size-4" />
							Create new workspace
						</DropdownItem>
					</Link>
				</div>
			</Dropdown>
			<Link to={`/workspaces/${currentWorkspace.slug}/settings`}>
				<Button variant="ghost" size="icon">
					<SettingsIcon className="size-5" />
				</Button>
			</Link>
		</div>
	);
};
