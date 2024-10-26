import { RepositoryConnection, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";

import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";

export const useCreateProject = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (data: { name: string; slug: string; repositoryConnection?: RepositoryConnection }) => {
			const { data: project, error } = await supabase
				.from("projects")
				.insert({
					name: data.name,
					slug: data.slug,
					workspace_id: workspace.id,
				})
				.select()
				.single();

			if (error) throw error;

			if (data.repositoryConnection) {
				handleSupabaseError(
					await supabase.from("repository_connections").insert({
						project_id: project.id,
						...data.repositoryConnection,
					}),
				);
			}

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
