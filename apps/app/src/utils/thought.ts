export const makeThoughtUrl = (orgSlug: string, thoughtId: string) => {
	return `/organizations/${orgSlug}/thoughts/${thoughtId}`;
};
