import { useNavigate } from "react-router-dom";
import { useMount } from "react-use";

import { useWorkspaceSlug } from "src/stores/workspace";
import { makeThoughtUrl } from "src/utils/thought";

import { LoadingView } from "../loading/LoadingView";
import { useEditThought } from "./hooks";

export const NewThoughtView = () => {
	const wsSlug = useWorkspaceSlug();

	const editThoughtMutation = useEditThought();
	const navigate = useNavigate();

	useMount(async () => {
		const newThought = await editThoughtMutation.mutateAsync();

		console.log("newThought", newThought);
		if (newThought) {
			navigate(makeThoughtUrl(wsSlug, newThought.id));
		}

		// else {
		// 	throw new Error("Failed to create new thought");
		// }
	});

	return <LoadingView />;
};
