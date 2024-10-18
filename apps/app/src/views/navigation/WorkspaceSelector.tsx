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
		<div className="flex max-w-full items-center justify-between gap-1 overflow-hidden px-4">
			<div className="flex flex-1 overflow-hidden">
				<Dropdown
					trigger={
						<Button variant="outline" className="flex flex-1 items-center justify-between overflow-hidden">
							<LayoutDashboardIcon className="size-4 text-secondary group-hover:text-accent" />
							<span className="flex-1 truncate">{currentWorkspace.name}</span>
							<ChevronDownIcon className="size-4" />
						</Button>
					}>
					<div className="flex flex-col">
						{allUserWorkspaces?.map(workspace => (
							<Link to={`/workspaces/${workspace.slug}`} key={workspace.id}>
								<DropdownItem className={cn(workspace.id === currentWorkspace.id ? "bg-card/50" : "")}>
									{workspace.id === currentWorkspace.id ? (
										<CheckIcon className="h-4 w-4" />
									) : (
										<span className="w-4" />
									)}
									<span
										className={cn(
											"flex-1 text-sm",
											workspace.id === currentWorkspace.id ? "font-medium" : "",
										)}>
										{workspace.name}
									</span>
								</DropdownItem>
							</Link>
						))}
						<DropdownSeparator />
						<Link to="/onboarding/workspaces/new/website-onboarding">
							<DropdownItem className="text-accent hover:bg-accent/10">
								<PlusIcon className="size-4" />
								Create new workspace
							</DropdownItem>
						</Link>
					</div>
				</Dropdown>
			</div>
			<Link to={`/workspaces/${currentWorkspace.slug}/settings`}>
				<Button variant="ghost" size="icon">
					<SettingsIcon className="size-5" />
				</Button>
			</Link>
		</div>
	);
};
