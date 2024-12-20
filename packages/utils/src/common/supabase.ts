import { Database } from "@repo/db";
import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export const handleSupabaseError = <T>(
    response: PostgrestSingleResponse<T>
) => {
    if (response.error) {
        console.error(
            "Supabase error:",
            response.error.message,
            "Details:",
            response.error.details,
            "Hint:",
            response.error.hint
        );
        throw new Error(`Database operation failed: ${response.error.message}`);
    }
    return response.data;
};

export function fixOneToOne<T>(objectOrNull: T[]): T | null {
    return (objectOrNull as T) || null;
}
