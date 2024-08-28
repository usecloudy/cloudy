import { SupabaseClient } from "@supabase/supabase-js";

import { Database } from "app/db/database.types";

import { handleSupabaseError } from "./supabase";

export const checkForSignal = async (signal: string, thoughtId: string, supabase: SupabaseClient<Database>) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("id, signals").eq("id", thoughtId).single());

	if (thought?.signals && Array.isArray(thought.signals)) {
		return thought.signals.includes(signal);
	}

	return false;
};

export const addSignal = async (signal: string, thoughtId: string, supabase: SupabaseClient<Database>) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("id, signals").eq("id", thoughtId).single());

	if (thought?.signals && Array.isArray(thought.signals)) {
		thought.signals.push(signal);
	} else {
		thought.signals = [signal];
	}

	await supabase.from("thoughts").update({ signals: thought.signals }).eq("id", thoughtId);
};

export const removeSignal = async (signal: string, thoughtId: string, supabase: SupabaseClient<Database>) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("id, signals").eq("id", thoughtId).single());

	if (thought?.signals && Array.isArray(thought.signals)) {
		thought.signals = thought.signals.filter(s => s !== signal);
	}

	await supabase.from("thoughts").update({ signals: thought.signals }).eq("id", thoughtId);
};

export const thoughtToPrompt = (thought: { title?: string | null; contentMd: string }) => {
	return `<note${thought.title ? ` title="${thought.title}"` : ""}>
${thought.contentMd}
</note>`;
};
