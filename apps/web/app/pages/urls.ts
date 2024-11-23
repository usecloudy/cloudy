export const makeDocUrl = (params: { workspaceSlug: string; projectSlug?: string | null; documentId: string }) => {
	return params.projectSlug
		? `/pages/${params.workspaceSlug}/${params.projectSlug}/doc/${params.documentId}`
		: `/pages/${params.workspaceSlug}/doc/${params.documentId}`;
};
