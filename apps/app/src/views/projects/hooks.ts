import { ProjectConnections, RepositoryConnection, RepositoryProvider } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";

import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";

export const useCreateProject = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (data: { name: string; slug: string; repositoryConnection?: RepositoryConnection }) => {
			const projectConnections: ProjectConnections = {
				repositories: [],
			};

			if (data.repositoryConnection) {
				projectConnections.repositories.push(data.repositoryConnection);
			}

			const { data: project, error } = await supabase
				.from("projects")
				.insert({
					name: data.name,
					slug: data.slug,
					workspace_id: workspace.id,
					connections: JSON.stringify(projectConnections),
				})
				.select()
				.single();

			if (error) throw error;
			return { projectSlug: project.slug };
		},
	});
};

export const useUserProjects = () => {
	return useQuery({
		queryKey: ["userProjects"],
		queryFn: async () => {
			// Implement the logic to fetch user's projects from your database
			const { data: projects, error } = await supabase
				.from("projects")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return projects;
		},
	});
};
