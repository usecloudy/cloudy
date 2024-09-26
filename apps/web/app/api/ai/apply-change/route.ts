import { ApplyChangePostRequestBody, SelectionRespondPostRequestBody, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { randomUUID } from "crypto";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as ApplyChangePostRequestBody;

	return applyChange(payload, supabase);
};

const makeApplyChangePrompts = ({
	contentHtml,
	suggestionContent,
}: {
	contentHtml: string;
	suggestionContent: string;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing writing tool that helps users write notes.`,
	},
	{
		role: "user",
		content: `Here is the note the user is writing:
\`\`\`
${contentHtml}
\`\`\`
Here is the change they want to include in the note:
\`\`\`
${suggestionContent}
\`\`\`
Return ONLY the entire contents of the note, with the change included.`,
	},
];

const applyChange = async (payload: ApplyChangePostRequestBody, supabase: SupabaseClient<Database>) => {
	const { thoughtId, suggestionContent } = payload;
	const { content: contentHtml } = handleSupabaseError(
		await supabase.from("thoughts").select("content").eq("id", thoughtId).single(),
	);

	if (!contentHtml) {
		throw new Error("Content not found");
	}

	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const heliconeHeaders = {
		"Helicone-User-Id": userId,
		"Helicone-Session-Name": "Apply Change",
		"Helicone-Session-Id": `apply-change/${randomUUID()}`,
	};

	const stream = await streamText({
		model: heliconeOpenAI.languageModel("gpt-4o-mini"),
		messages: makeApplyChangePrompts({ contentHtml, suggestionContent }),
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "edit-selection",
		},
	});

	return stream.toTextStreamResponse();
};
