import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";
import { getContextForThought } from "app/api/utils/thoughts";

interface Payload {
	thoughtId: string;
	content: string;
	instruction: string;
}

export const maxDuration = 90;

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always run dynamically

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return editSelection(payload, supabase);
};

const editSelection = async (payload: Payload, supabase: SupabaseClient<Database>) => {
	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const heliconeHeaders = {
		"Helicone-User-Id": userId,
		"Helicone-Session-Name": "Edit Selection",
		"Helicone-Session-Id": `edit-selection/${randomUUID()}`,
	};
	const contextText = await getContextForThought(payload.thoughtId, supabase, {
		...heliconeHeaders,
		"Helicone-Session-Path": "edit-selection/context",
	});

	const hasContext = Boolean(contextText);

	const stream = await streamText({
		model: heliconeOpenAI.languageModel("gpt-4o-2024-08-06"),
		system: "You are a helpful assistant that edits text.",
		messages: [
			...(hasContext
				? [
						{
							role: "user" as const,
							content: `Some relevant context for the below instruction:
${contextText}`,
						},
					]
				: []),
			{
				role: "user",
				content: `The selection is marked with the [[[ and ]]] tags, for example, in the following text: "Hi [[[user]]] I'm doing well", the selection is "user".

The text is in HTML format to be used in the Tiptap editor.
Use the relevant html tags to format the text when needed, such as <ol></ol> for ordered lists, <ul></ul> for unordered lists, <h1></h1> for headings, etc.

Return the content that will replace the selection, wrap your new changes with the [[[ and ]]] tags so the user sees it after the change given the instruction. Make sure replacing the content in the [[[ and ]]] tags will not break the HTML formatting.

Below is the text with the selection marked with [[[ and ]]]:
---
<p>
<h1>This [[[is the title</h1>
<p>This is the content</p>
<ul>
<li>This is a list]]] item</li>
</ul>
</p>
---

Edit the following selection given the instruction:
"Make the content longer"
Return only the content that will replace the selection, you MUST start with [[[ and end with ]]]:
---
[[[is the title</h1>
<p>This is the content and it is much longer</p>
<ul>
<li>This is a list]]]
---

Below is the text with the selection marked with [[[ and ]]]:
---
${payload.content}
---

Edit the following selection given the instruction:
"${payload.instruction}"
Return only the content that will replace the selection, you MUST start with [[[ and end with ]]]:
---`,
			},
		],
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		stopSequences: ["]]]"],
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "edit-selection",
		},
	});

	return stream.toTextStreamResponse();
};
