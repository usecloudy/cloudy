import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

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

export const makeDocUrl = (components: { workspaceSlug: string; projectSlug?: string; docId: string }) => {
	if (components.projectSlug) {
		return makeProjectDocUrl(components.workspaceSlug, components.projectSlug, components.docId);
	}
	return makeThoughtUrl(components.workspaceSlug, components.docId);
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

			return newThought;
		},
		onError: e => {
			console.error(e);
			toast.error("Failed to create thought");
		},
		onSuccess: newThought => {
			if (workspace && newThought) {
				navigate(makeDocUrl({ workspaceSlug: workspace.slug, projectSlug: project?.slug, docId: newThought.id }));
			}
		},
	});
};
