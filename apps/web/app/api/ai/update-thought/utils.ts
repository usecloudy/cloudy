import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export type ThoughtRecord = Database["public"]["Tables"]["thoughts"]["Row"];

export const markThoughtAsProcessing = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	await supabase.from("thoughts").update({ suggestion_status: "processing" }).eq("id", thoughtId);
};

export const markThoughtProcessingAsDone = async (
	thoughtId: string,
	supabase: SupabaseClient<Database>,
	thoughtContentMd?: string | null,
) => {
	handleSupabaseError(
		await supabase
			.from("thoughts")
			.update({ suggestion_status: "idle", ...(thoughtContentMd && { last_suggestion_content_md: thoughtContentMd }) })
			.eq("id", thoughtId),
	);
};
