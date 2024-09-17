import { handleSupabaseError } from "@cloudy/utils/common";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";

import { supabase } from "src/clients/supabase";

import { LoadingView } from "../loading/LoadingView";

export const WorkspacelessThoughtRedirectView = () => {
	const { thoughtId } = useParams();

	const { data, isLoading } = useQuery({
		queryKey: ["workspaces"],
		queryFn: async () => {
			return handleSupabaseError(
				await supabase.from("thoughts").select("id, workspace:workspaces(slug)").eq("id", thoughtId!).single(),
			);
		},
	});

	if (isLoading) {
		return <LoadingView />;
	}

	const slug = data?.workspace?.slug;

	if (!slug) {
		return <Navigate to="/" />;
	}

	return <Navigate to={`/workspaces/${slug}/thoughts/${thoughtId}`} />;
};
