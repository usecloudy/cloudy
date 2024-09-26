export const collectionQueryKeys = {
	collectionDetail: (collectionId: string) => ["collection", collectionId] as const,
	collectionDetailThoughts: (collectionId?: string) =>
		collectionId ? (["collection", "thoughts", collectionId] as const) : (["collection", "thoughts"] as const),
	workspaceCollections: (workspaceId?: string) => [workspaceId, "collections"] as const,
};

export const thoughtQueryKeys = {
	thoughtDetail: (thoughtId?: string) => ["thought", thoughtId ?? "new"] as const,
	workspaceSidebarLatestThoughts: (workspaceId?: string) => [workspaceId, "latestThoughts"] as const,
	workspaceHomeThoughts: (workspaceId?: string) => [workspaceId, "homeThoughts"] as const,
};

export const topicQueryKeys = {
	topics: () => ["topics"] as const,
	topicMatches: (topicId?: string) => ["topic", "matches", topicId] as const,
};

export const userQueryKeys = {
	userRecord: (userId?: string) => (userId ? (["userRecord", userId] as const) : (["userRecord"] as const)),
};

export const paymentsQueryKeys = {
	customerStatus: (wsSlug?: string) =>
		wsSlug ? (["payments", "customers", "status", wsSlug] as const) : (["payments", "customers", "status"] as const),
};
