import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

export const getWorkspaceMemory = async (workspaceId: string, supabase: SupabaseClient<Database>) => {
	const { data } = await supabase.from("workspace_memories").select("*").eq("workspace_id", workspaceId).single();
	return data;
};

export const getWorkspaceMemoryPromptDump = async (workspaceId: string, supabase: SupabaseClient<Database>) => {
	const memory = await getWorkspaceMemory(workspaceId, supabase);
	return memory?.mission_blurb
		? `The mission of this workspace is:
${memory.mission_blurb}

`
		: "";
};
