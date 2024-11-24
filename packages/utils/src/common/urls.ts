export const makePublicDocPath = (params: {
    workspaceSlug: string;
    projectSlug?: string | null;
    documentId: string;
}) => {
    return params.projectSlug
        ? `/pages/${params.workspaceSlug}/${params.projectSlug}/doc/${params.documentId}`
        : `/pages/${params.workspaceSlug}/doc/${params.documentId}`;
};

export const makePublicDocUrl = (
    baseUrl: string,
    params: Parameters<typeof makePublicDocPath>[0]
) => {
    return `${baseUrl}${makePublicDocPath(params)}`;
};

export const makeDocPath = (params: {
    workspaceSlug: string;
    projectSlug?: string | null;
    documentId: string;
}) => {
    return params.projectSlug
        ? `/workspaces/${params.workspaceSlug}/projects/${params.projectSlug}/docs/${params.documentId}`
        : `/workspaces/${params.workspaceSlug}/docs/${params.documentId}`;
};

export const makeDocUrl = (
    baseUrl: string,
    params: Parameters<typeof makeDocPath>[0]
) => {
    return `${baseUrl}${makeDocPath(params)}`;
};
