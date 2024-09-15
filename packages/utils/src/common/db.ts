import { Database } from "@repo/db";

export type OrganizationRecord =
    Database["public"]["Tables"]["workspaces"]["Row"];

export type UserRecord = Database["public"]["Tables"]["users"]["Row"];
