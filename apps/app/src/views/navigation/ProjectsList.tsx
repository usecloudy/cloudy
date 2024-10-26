import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";

const useWorkspaceProjects = () => {
	const workspace = useWorkspace();

	return useQuery({
		queryKey: ["workspace", workspace?.id, "projects"],
		queryFn: async () => {
			return handleSupabaseError(await supabase.from("projects").select("*").eq("workspace_id", workspace?.id));
		},
	});
};

export const ProjectsList = () => {
	const workspace = useWorkspace();
	const { data: workspaceProjects } = useWorkspaceProjects();

	return (
		<div className="flex flex-col">
			<span className="mb-1 text-sm font-medium text-secondary">Projects</span>
			{workspaceProjects?.map(project => (
				<Link to={`/workspaces/${workspace.slug}/projects/${project.slug}`} key={project.id}>
					<div className="w-full rounded px-4 py-1 text-sm hover:bg-card">{project.name}</div>
				</Link>
			))}
		</div>
	);
};
