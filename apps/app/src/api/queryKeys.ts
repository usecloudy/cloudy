export const collectionQueryKeys = {
	collectionDetail: (collectionId: string) => ["collection", collectionId] as const,
	collectionDetailThoughts: (collectionId: string) => ["collection", collectionId, "thoughts"] as const,
	workspaceCollections: (workspaceId?: string) => [workspaceId, "collections"] as const,
};

export const thoughtQueryKeys = {
	thoughtDetail: (thoughtId?: string) => ["thought", thoughtId ?? "new"] as const,
	workspaceSidebarLatestThoughts: (workspaceId?: string) => [workspaceId, "latestThoughts"] as const,
};
