import { handleSupabaseError, makeHumanizedTime } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";

import { heliconeOpenAI } from "./helicone";
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

export const thoughtToPrompt = (thought: { title?: string | null; contentMd: string | null; updatedAt?: string | null }) => {
	return `<note${thought.title ? ` title="${thought.title}"` : ""}${thought.updatedAt ? ` updated_at="${makeHumanizedTime(thought.updatedAt)}"` : ""}>
${thought.contentMd ?? ""}
</note>`;
};

export const noteDiffToPrompt = (diff: string) => {
	return `Below are the most recent changes to the note:
<recent_changes>
${diff}
</recent_changes>`;
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

export const getContextForThought = async (
	thoughtId: string,
	supabase: SupabaseClient<Database>,
	headers: Record<string, string>,
) => {
	const linkedThoughtsText = await getLinkedThoughtsPromptDump(thoughtId, supabase);
	const relatedThoughtsText = await getRelatedThoughtsPromptDump(thoughtId, supabase);

	if ((linkedThoughtsText + relatedThoughtsText).length > 2048) {
		return condenseContext(linkedThoughtsText, relatedThoughtsText, headers);
	}

	return linkedThoughtsText + relatedThoughtsText;
};

const condenseContext = async (linkedThoughtsText: string, relatedThoughtsText: string, headers: Record<string, string>) => {
	const { text: condensedText } = await generateText({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
		temperature: 0.0,
		messages: [
			{
				role: "user",
				content: `Given the below relevant notes, provide a 1-2 paragraph summary of the most important information:
${linkedThoughtsText}
${relatedThoughtsText}`,
			},
		],
		headers,
	});

	return `<relevant_context>
${condensedText}
</relevant_context>
`;
};
