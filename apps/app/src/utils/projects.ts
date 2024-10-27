import { ProjectRecord, handleSupabaseError } from "@cloudy/utils/common";
import { useMutation, useQuery } from "@tanstack/react-query";

import { queryClient } from "src/api/queryClient";
import { projectQueryKeys } from "src/api/queryKeys";
import { supabase } from "src/clients/supabase";
import { useWorkspace } from "src/stores/workspace";

export const makeProjectHomeUrl = (wsSlug: string, projectSlug: string) => {
	return `/workspaces/${wsSlug}/projects/${projectSlug}`;
};

export const makeProjectSettingsUrl = (wsSlug: string, projectSlug: string) => {
	return `/workspaces/${wsSlug}/projects/${projectSlug}/settings`;
};

export const makeNewProjectUrl = (wsSlug: string) => {
	return `/workspaces/${wsSlug}/projects/new`;
};

export const useEditProject = () => {
	const workspace = useWorkspace();

	return useMutation({
		mutationFn: async (payload: { projectId: string; name?: string; slug?: string }) => {
			let updateObject: Partial<ProjectRecord> = {};

			if (payload.name) updateObject.name = payload.name;
			if (payload.slug) updateObject.slug = payload.slug;

			const updatedProject = await supabase
				.from("projects")
				.update(updateObject)
				.eq("id", payload.projectId)
				.select()
				.single();

			return handleSupabaseError(updatedProject);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [workspace.slug, "projects"] });
		},
	});
};

export const useProjectRepos = (projectId?: string | null) => {
	return useQuery({
		queryKey: projectQueryKeys.repos(projectId),
		queryFn: async () => {
			if (!projectId) return [];
			return handleSupabaseError(await supabase.from("repository_connections").select("*").eq("project_id", projectId));
		},
	});
};
