import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "src/components/Button";
import { useWorkspace } from "src/stores/workspace";
import { makeNewProjectUrl } from "src/utils/projects";
import { useWorkspaceProjects } from "src/utils/workspaces";

export const ProjectsList = () => {
	const workspace = useWorkspace();
	const { data: workspaceProjects } = useWorkspaceProjects();

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between gap-1">
				<span className="mb-1 text-sm font-medium text-secondary">Projects</span>
				<Link to={makeNewProjectUrl(workspace.slug)}>
					<Button variant="ghost" size="icon-sm" className="text-secondary">
						<PlusIcon className="size-4" />
					</Button>
				</Link>
			</div>
			{workspaceProjects && workspaceProjects.length > 0 ? (
				workspaceProjects.map(project => (
					<Link to={`/workspaces/${workspace.slug}/projects/${project.slug}`} key={project.id}>
						<div className="w-full rounded px-4 py-1 text-sm hover:bg-card">{project.name}</div>
					</Link>
				))
			) : (
				<div className="mt-1 w-full rounded border border-dashed border-border px-4 py-1 text-center text-xs text-tertiary">
					No projects yet
				</div>
			)}
		</div>
	);
};
