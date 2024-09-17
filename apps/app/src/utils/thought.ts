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
