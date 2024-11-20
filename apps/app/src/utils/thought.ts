import { ellipsizeText } from "@cloudy/utils/common";

export const makeThoughtUrl = (wsSlug: string, thoughtId: string) => {
	return `/workspaces/${wsSlug}/thoughts/${thoughtId}`;
};

export const makeProjectDocUrl = (wsSlug: string, projectSlug: string, docId: string) => {
	return `/workspaces/${wsSlug}/projects/${projectSlug}/docs/${docId}`;
};

export const makeDocUrl = (components: { workspaceSlug: string; projectSlug?: string | null; docId: string }) => {
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
