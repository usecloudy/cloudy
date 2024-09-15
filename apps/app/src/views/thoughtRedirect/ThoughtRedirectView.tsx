import { handleSupabaseError } from "@cloudy/utils/common";
import { useNavigate, useParams } from "react-router-dom";
import { useAsync } from "react-use";

import { supabase } from "src/clients/supabase";
import { makeThoughtUrl } from "src/utils/thought";

import { LoadingView } from "../loading/LoadingView";

export const ThoughtRedirectView = () => {
	const { thoughtId } = useParams();
	const navigate = useNavigate();

	useAsync(async () => {
		const result = handleSupabaseError(
			await supabase.from("thoughts").select("organization:organizations(slug)").eq("id", thoughtId!).single(),
		);

		if (result.organization?.slug) {
			navigate(makeThoughtUrl(result.organization.slug, thoughtId!));
		} else {
			// TODO: handle this error
		}
	}, [thoughtId]);

	return <LoadingView />;
};
