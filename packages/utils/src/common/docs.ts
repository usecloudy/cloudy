export interface RepoReference {
    repoConnectionId: string;
    repoFullName: string;
    path: string;
    type: "file" | "directory";
}
