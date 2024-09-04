import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

interface Payload {
	content: string;
	instruction: string;
}

export const maxDuration = 90;

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always run dynamically

export const POST = async (req: NextRequest) => {
	getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return editSelection(payload);
};

const editSelection = async (payload: Payload) => {
	const stream = await streamText({
		model: openai.languageModel("gpt-4o-2024-08-06"),
		system: "You are a helpful assistant that edits text.",
		messages: [
			{
				role: "user",
				content: `The selection is marked with the [[[ and ]]] tags, for example, in the following text: "Hi [[[user]]] I'm doing well", the selection is "user".

The text is in HTML format to be used in the Tiptap editor.
Use the relevant html tags to format the text when needed, such as <ol></ol> for ordered lists, <ul></ul> for unordered lists, <h1></h1> for headings, etc.

Return the entire content after the edit, wrap your new changes with the [[[ and ]]] tags so the user sees it after the change given the instruction. Make sure replacing the content in the [[[ and ]]] tags will not break the HTML formatting.

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
Response:
---
<p>
<h1>This [[[is the title</h1>
<p>This is the content and it is much longer</p>
<ul>
<li>This is a list]]] item</li>
</ul>
</p>
---

Below is the text with the selection marked with [[[ and ]]]:
---
${payload.content}
---

Edit the following selection given the instruction:
"${payload.instruction}"
Response:
---`,
			},
		],
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
	});

	return stream.toTextStreamResponse();
};
