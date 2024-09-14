export const makeThoughtUrl = (wsSlug: string, thoughtId: string) => {
	return `/workspaces/${wsSlug}/thoughts/${thoughtId}`;
};
