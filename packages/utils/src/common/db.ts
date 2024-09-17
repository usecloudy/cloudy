import { Database } from "@repo/db";

export type WorkspaceRecord = Database["public"]["Tables"]["workspaces"]["Row"];

export type UserRecord = Database["public"]["Tables"]["users"]["Row"];