import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export enum WorkspaceRole {
    OWNER = "owner",
    MEMBER = "member",
}

export const VALID_WORKSPACE_SLUG_CHARS = /[a-z0-9-]/;

export const checkIfSlugIsAvailable = async (
    slug: string,
    supabase: SupabaseClient<Database>
) => {
    const existingSlugs = await supabase
        .from("workspaces")
        .select("slug", { count: "exact" })
        .eq("slug", slug);

    return existingSlugs.count === 0;
};

export const createNonConflictingSlug = async (
    name: string,
    supabase: SupabaseClient<Database>
) => {
    const slugAttempt = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const existingSlugs = await supabase
        .from("workspaces")
        .select("slug", { count: "exact" })
        .eq("slug", slugAttempt);

    if (existingSlugs.count === 0) {
        return slugAttempt;
    }

    return `${slugAttempt}-${existingSlugs.count}`;
};
