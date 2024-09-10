import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";

import { getRelatedThoughts } from "./relatedChunks";

export const checkForSignal = async (signal: string, thoughtId: string, supabase: SupabaseClient) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("id, signals").eq("id", thoughtId).single());

	if (thought?.signals && Array.isArray(thought.signals)) {
		return thought.signals.includes(signal);
	}

	return false;
};

export const addSignal = async (signal: string, thoughtId: string, supabase: SupabaseClient) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("id, signals").eq("id", thoughtId).single());

	if (thought?.signals && Array.isArray(thought.signals)) {
		thought.signals.push(signal);
	} else {
		thought.signals = [signal];
	}

	await supabase.from("thoughts").update({ signals: thought.signals }).eq("id", thoughtId);
};

export const removeSignal = async (signal: string, thoughtId: string, supabase: SupabaseClient) => {
	const thought = handleSupabaseError(await supabase.from("thoughts").select("id, signals").eq("id", thoughtId).single());

	if (thought?.signals && Array.isArray(thought.signals)) {
		thought.signals = thought.signals.filter(s => s !== signal);
	}

	await supabase.from("thoughts").update({ signals: thought.signals }).eq("id", thoughtId);
};

export const thoughtToPrompt = (thought: { title?: string | null; contentMd: string | null }) => {
	return `<note${thought.title ? ` title="${thought.title}"` : ""}>
${thought.contentMd ?? ""}
</note>`;
};

export const thoughtIntentToPrompt = (intent?: string | null) => {
	if (!intent) return "";

	return `
The user has stated that their goal for writing this note is:
---
${intent}
---
`;
};

export const getLinkedThoughts = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	const linkedThoughts = handleSupabaseError(
		await supabase
			.from("thought_links")
			.select(
				`thought:thoughts!linked_to (
				id,
				title,
				content_md
			)`,
			)
			.or(`linked_from.eq.${thoughtId},linked_to.eq.${thoughtId}`),
	);

	return linkedThoughts.flatMap(thought => thought.thought).map(t => ({ ...t, contentMd: t.content_md }));
};

export const getLinkedThoughtsPromptDump = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	const linkedThoughts = await getLinkedThoughts(thoughtId, supabase);

	return linkedThoughts.length > 0
		? `Below are some notes the user has linked with the current note, use this as context:
${linkedThoughts.map(thought => thoughtToPrompt(thought)).join("\n")}

`
		: "";
};

export const getRelatedThoughtsPromptDump = async (thoughtId: string, supabase: SupabaseClient<Database>) => {
	const relatedThoughts = await getRelatedThoughts(thoughtId, supabase);

	return relatedThoughts.length > 0
		? `Below are some related notes to the current note, use this as context:
${relatedThoughts.map(thought => thoughtToPrompt(thought)).join("\n")}

`
		: "";
};
