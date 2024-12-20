import { Database } from "@repo/db";

export type WorkspaceRecord = Database["public"]["Tables"]["workspaces"]["Row"];

export type UserRecord = Database["public"]["Tables"]["users"]["Row"];

export type CollectionThoughtRecord =
    Database["public"]["Tables"]["collection_thoughts"]["Row"];

export type ProjectRecord = Database["public"]["Tables"]["projects"]["Row"];

export type ChatThreadRecord =
    Database["public"]["Tables"]["chat_threads"]["Row"];

export type ChatMessageRecord =
    Database["public"]["Tables"]["chat_messages"]["Row"];

export enum RepositoryProvider {
    GITHUB = "github",
}

export interface ProjectConnections {
    repositories: RepositoryConnection[];
}

export interface RepositoryConnection {
    provider: RepositoryProvider;
    external_id: string;
    installation_id: string;
    owner: string;
    name: string;
    default_branch: string;
}

export type RepositoryConnectionRecord =
    Database["public"]["Tables"]["repository_connections"]["Row"];

export type DocumentPrDraftRecord =
    Database["public"]["Tables"]["document_pr_drafts"]["Row"];
