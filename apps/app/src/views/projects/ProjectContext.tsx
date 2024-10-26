import { ProjectRecord, handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useParams } from "react-router-dom";
import { create } from "zustand";

import { supabase } from "src/clients/supabase";

import { LoadingView } from "../loading/LoadingView";

interface ProjectStore {
	project: ProjectRecord | null;
	setProject: (project: ProjectRecord | null) => void;
}

export const useProjectStore = create<ProjectStore>(set => ({
	project: null,
	setProject: project => set({ project }),
}));

export const useProject = () => {
	const { project } = useProjectStore();

	return project;
};

export const ProjectOutlet = () => {
	const { projectSlug } = useParams();
	const setProject = useProjectStore(state => state.setProject);

	const { data: project, isLoading } = useQuery({
		queryKey: ["project", projectSlug],
		queryFn: async () => {
			if (!projectSlug) {
				return null;
			}

			const project = handleSupabaseError(await supabase.from("projects").select("*").eq("slug", projectSlug).single());
			setProject(project);
			return project;
		},
	});

	if (isLoading || !project) {
		return <LoadingView />;
	}

	return <Outlet />;
};
