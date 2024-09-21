import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useWorkspaceStore } from "src/stores/workspace";
import { useEditThought } from "src/views/thoughtDetail/hooks";

import { ellipsizeText } from "./strings";

export const makeThoughtUrl = (wsSlug: string, thoughtId: string) => {
	return `/workspaces/${wsSlug}/thoughts/${thoughtId}`;
};

export const makeThoughtLabel = (thought: {
	title: string | null;
	content_plaintext: string | null;
	content_md: string | null;
}) => {
	return ellipsizeText(thought.title || thought.content_plaintext || thought.content_md || "Untitled", 36);
};

export const useCreateThought = () => {
	const workspace = useWorkspaceStore(s => s.workspace);
	const editThoughtMutation = useEditThought();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async () => {
			if (!workspace) {
				throw new Error("Workspace not found");
			}

			const newThought = await editThoughtMutation.mutateAsync();
			if (newThought) {
				navigate(makeThoughtUrl(workspace.slug, newThought.id));
			}
		},
	});
};
