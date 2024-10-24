import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { useWorkspaceStore } from "src/stores/workspace";
import { useProject } from "src/views/projects/ProjectContext";
import { useEditThought } from "src/views/thoughtDetail/hooks";

import { ellipsizeText } from "./strings";

export const makeThoughtUrl = (wsSlug: string, thoughtId: string) => {
	return `/workspaces/${wsSlug}/thoughts/${thoughtId}`;
};

export const makeProjectDocUrl = (wsSlug: string, projectSlug: string, docId: string) => {
	return `/workspaces/${wsSlug}/projects/${projectSlug}/docs/${docId}`;
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
	const project = useProject();

	const editThoughtMutation = useEditThought();
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: { collectionId?: string }) => {
			if (!workspace) {
				throw new Error("Workspace not found");
			}

			const newThought = await editThoughtMutation.mutateAsync({
				collectionId: payload.collectionId,
				ts: new Date(),
			});

			if (newThought) {
				if (project) {
					navigate(makeProjectDocUrl(workspace.slug, project.slug, newThought.id));
				} else {
					navigate(makeThoughtUrl(workspace.slug, newThought.id));
				}
			}
		},
	});
};
