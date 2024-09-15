import { Database } from "@repo/db";

export type IntegrationMessage =
    Database["public"]["Tables"]["integration_messages"]["Row"];
