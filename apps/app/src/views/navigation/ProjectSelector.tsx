import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, HomeIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { workspaceQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { Button } from "src/components/Button";
import { Dropdown, DropdownItem, DropdownSeparator } from "src/components/Dropdown";
import { useWorkspaceStore } from "src/stores/workspace";
import { cn } from "src/utils";
import { makeProjectHomeUrl, makeProjectSettingsUrl } from "src/utils/projects";

import { useProject } from "../projects/ProjectContext";

const useWorkspaceProjects = () => {
	const currentWorkspace = useWorkspaceStore(s => s.workspace);

	return useQuery({
		queryKey: workspaceQueryKeys.allProjects(currentWorkspace?.id),
		queryFn: async () => {
			if (!currentWorkspace) {
				return [];
			}

			return handleSupabaseError(await supabase.from("projects").select("*").eq("workspace_id", currentWorkspace.id));
		},
	});
};

export const ProjectSelector = () => {
	const currentWorkspace = useWorkspaceStore(s => s.workspace);
	const { data: projects } = useWorkspaceProjects();
	const currentProject = useProject();

	if (!currentWorkspace) {
		return null;
	}

	return (
		<div className="flex max-w-full items-center justify-between gap-1 overflow-hidden px-4">
			<div className="flex flex-1 overflow-hidden">
				<Dropdown
					trigger={
						<Button
							variant="outline"
							className="flex h-12 flex-1 items-center justify-between overflow-hidden pl-4 pr-2">
							<div className="flex flex-1 flex-col items-start overflow-hidden">
								<span className="text-xs text-secondary">Project</span>
								{currentProject ? (
									<span className="truncate">{currentProject.name}</span>
								) : (
									<span className="truncate">No project selected</span>
								)}
							</div>
							<ChevronDownIcon className="size-4" />
						</Button>
					}>
					<div className="flex flex-col">
						<Link to={makeProjectHomeUrl(currentWorkspace.slug, currentProject?.slug ?? "")}>
							<DropdownItem>
								<HomeIcon className="size-4" />
								Project home
							</DropdownItem>
						</Link>
						<Link to={makeProjectSettingsUrl(currentWorkspace.slug, currentProject?.slug ?? "")}>
							<DropdownItem>
								<SettingsIcon className="size-4" />
								Project settings
							</DropdownItem>
						</Link>
						<DropdownSeparator />
						{projects?.map(project => (
							<Link to={`/workspaces/${currentWorkspace.slug}/projects/${project.slug}`} key={project.id}>
								<DropdownItem className={cn(project.id === currentProject?.id ? "bg-card/50" : "")}>
									{project.id === currentProject?.id ? (
										<CheckIcon className="h-4 w-4" />
									) : (
										<span className="w-4" />
									)}
									<span
										className={cn(
											"flex-1 text-sm",
											project.id === currentWorkspace.id ? "font-medium" : "",
										)}>
										{project.name}
									</span>
								</DropdownItem>
							</Link>
						))}
						<DropdownSeparator />
						<Link to={`/workspaces/${currentWorkspace.slug}/projects/new`}>
							<DropdownItem className="text-accent hover:bg-accent/10">
								<PlusIcon className="size-4" />
								Create new project
							</DropdownItem>
						</Link>
					</div>
				</Dropdown>
			</div>
		</div>
	);
};
