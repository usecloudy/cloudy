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
    const slugBase = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const { data: existingSlugs } = await supabase
        .from("workspaces")
        .select("slug")
        .ilike("slug", `${slugBase}%`);

    if (!existingSlugs || existingSlugs.length === 0) {
        return slugBase;
    }

    const slugNumbers = existingSlugs
        .map((workspace) => {
            const match = workspace.slug.match(
                new RegExp(`^${slugBase}-(\\d+)$`)
            );
            return match && match[1] ? parseInt(match[1], 10) : 0;
        })
        .sort((a, b) => a - b);

    const nextNumber =
        slugNumbers.length > 0
            ? (slugNumbers[slugNumbers.length - 1] ?? 0) + 1
            : 1;
    return `${slugBase}-${nextNumber}`;
};

export type OnboardingStatus = "initial-collections" | "done";
