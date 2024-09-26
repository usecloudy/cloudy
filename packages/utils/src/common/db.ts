import { Database } from "@repo/db";

export type WorkspaceRecord = Database["public"]["Tables"]["workspaces"]["Row"];

export type UserRecord = Database["public"]["Tables"]["users"]["Row"];

export type TopicRecord = Database["public"]["Tables"]["topics"]["Row"];

export type ThoughtChatThreadRecord =
    Database["public"]["Tables"]["thought_chat_threads"]["Row"];
