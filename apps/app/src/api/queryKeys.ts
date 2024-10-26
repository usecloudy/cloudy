export const collectionQueryKeys = {
	collectionDetail: (collectionId: string) => ["collection", collectionId] as const,
	collectionDetailThoughts: (collectionId?: string) =>
		collectionId ? (["collection", "thoughts", collectionId] as const) : (["collection", "thoughts"] as const),
	collectionDetailSubCollections: (collectionId?: string) =>
		collectionId ? (["collection", "subCollections", collectionId] as const) : (["collection", "subCollections"] as const),
	collectionDetailParents: (collectionId?: string) =>
		collectionId ? (["collection", "parents", collectionId] as const) : (["collection", "parents"] as const),
	workspaceCollections: (workspaceId?: string) => [workspaceId, "collections"] as const,
};

export const thoughtQueryKeys = {
	thoughtDetail: (thoughtId?: string) => ["thought", thoughtId ?? "new"] as const,
	workspaceSidebarLatestThoughts: (workspaceId?: string) => [workspaceId, "latestThoughts"] as const,
	workspaceHomeThoughts: (workspaceId?: string) => [workspaceId, "homeThoughts"] as const,
	relatedThoughts: (thoughtId?: string) => ["relatedThoughts", thoughtId] as const,
	sharedWith: (thoughtId?: string) => ["thought", thoughtId, "sharedWith"] as const,
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

export const commentThreadQueryKeys = {
	comment: (commentId?: string | null) => ["comment", commentId, "comment"] as const,
	threadComments: (commentId?: string | null) => ["comment", commentId, "threadComments"] as const,
	temporaryComment: (commentId?: string | null) => ["comment", commentId, "temporaryComment"] as const,
};

export const workspaceQueryKeys = {
	allProjects: (workspaceId?: string) => ["workspace", workspaceId, "projects"] as const,
};

export const projectQueryKeys = {
	library: (projectId?: string) => ["project", projectId, "library"] as const,
};

export const thoughtKeys = {
	all: ["thoughts"] as const,
	lists: () => [...thoughtKeys.all, "list"] as const,
	list: (filters: string) => [...thoughtKeys.lists(), { filters }] as const,
	details: () => [...thoughtKeys.all, "detail"] as const,
	detail: (id: string) => [...thoughtKeys.details(), id] as const,
} as const;
