import { Database } from "@repo/db";

export type OrganizationRecord =
    Database["public"]["Tables"]["organizations"]["Row"];

export type UserRecord = Database["public"]["Tables"]["users"]["Row"];
