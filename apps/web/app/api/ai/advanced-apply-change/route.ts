import {
	ApplyChangePostRequestBody,
	ApplyChangePostResponse,
	extractInnerTextFromXml,
	handleSupabaseError,
} from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { heliconeAnthropic } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: NextRequest) => {
	const supabase = await getSupabase({ request: req, mode: "client" });

	const payload = (await req.json()) as ApplyChangePostRequestBody;

	return applyChange(payload, supabase);
};

const makeApplyOriginalSnippetPrompts = ({
	contentMd,
	suggestionContent,
	currentOriginalSnippet,
}: {
	contentMd: string;
	suggestionContent: string;
	currentOriginalSnippet: string | null;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You an amazing writing tool that helps users write.

You will be asked to convert a markdown change into HTML to be applied to the original document html.
- The original snippet and replacement snippet is the input you would place into a .replace() call for a string, where the original snippet is the string to be replaced and the replacement snippet is the string to replace it with.
- Each of them will be subsets of the original document html you want to apply the change to. The original snippet must EXACTLY match a subset of the original document html.
- Some requested changes could be malformed, so you should try to correct them.
- You can create code blocks with <pre><code class="language-[language]">...</code></pre>, it cannot be nested, so create them at the root level. Also, don't include a prefix newline after the opening <code> tag, as that newline will be included in the snippet.

<example>
For example, given this document in markdown format:
<document>
# This is a header.

This is a paragraph.

This is another paragraph.

This is another header.

This is the next section's paragraph.
</document>

And this requested change, in markdown format:
<change>
<original_snippet>
# This is a  header.

This is aparagraph.
</original_snippet>
<replacement_snippet>
## This is a replacement header.

This is a replacement paragraph.
</replacement_snippet>
</change>

The requested changes couldn't be applied because something was malformed or out of date. Fix any issues with the change request, and return the corrected/updated original markdown snippet, and replacement markdown snippet:
<fixed_change>
<original_snippet>
# This is a header.

This is a paragraph.
</original_snippet>
<replacement_snippet>
## This is a replacement header.

This is a replacement paragraph.
</replacement_snippet>
</example>`,
	},
	{
		role: "user",
		content: [
			{
				type: "text",
				text: `Here is the document the user is writing, in markdown format:
<document>
${contentMd}
</document>

And this requested change, in markdown format:
<change>
${suggestionContent}
</change>

The requested changes couldn't be applied because something was malformed or out of date. Fix any issues with the change request, and return the corrected/updated original markdown snippet, and replacement markdown snippet:`,
				experimental_providerMetadata: {
					anthropic: { cacheControl: { type: "ephemeral" } },
				},
			},
		],
	},
	{
		role: "assistant",
		content: `<change>
<original_snippet>${currentOriginalSnippet ? "\n" + currentOriginalSnippet : ""}`,
	},
];

const runAttempt = async ({
	contentMd,
	suggestionContent,
	heliconeHeaders,
	currentOriginalSnippet,
	attempt,
}: {
	contentMd: string;
	suggestionContent: string;
	heliconeHeaders: Record<string, string>;
	currentOriginalSnippet: string | null;
	attempt: number;
}) => {
	const abortController = new AbortController();

	const { textStream } = await streamText({
		model: heliconeAnthropic.languageModel("claude-3-5-haiku-20241022", { cacheControl: true }),
		messages: makeApplyOriginalSnippetPrompts({ contentMd, suggestionContent, currentOriginalSnippet }),
		temperature: 0.7,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": `apply-change/attempt:${attempt}`,
		},
		abortSignal: abortController.signal,
	});

	let text = currentOriginalSnippet ?? "";
	let originalSnippet = currentOriginalSnippet ?? "";

	for await (const chunk of textStream) {
		text += chunk;

		const endsWithPartialTag = /<\/[^>]*$/.test(text);

		if (!endsWithPartialTag && !text.includes("</original_snippet>")) {
			const newOriginalSnippet = text.split("</original_snippet>")[0]?.trim() ?? "";

			console.log("newOriginalSnippet", newOriginalSnippet);

			if (!contentMd.includes(newOriginalSnippet)) {
				abortController.abort();
				return { originalSnippet, replacementSnippet: null, success: false };
			}

			originalSnippet = newOriginalSnippet;
		}
	}

	originalSnippet = extractInnerTextFromXml("<original_snippet>" + text, "original_snippet")?.trim() ?? "";
	const replacementSnippet = extractInnerTextFromXml(text, "replacement_snippet")?.trim();

	return { originalSnippet, replacementSnippet: replacementSnippet ?? null, success: true };
};

const applyChange = async (payload: ApplyChangePostRequestBody, supabase: SupabaseClient<Database>) => {
	const { documentId, suggestionContent } = payload;
	const { content_md: contentMd } = handleSupabaseError(
		await supabase.from("thoughts").select("content_md").eq("id", documentId).single(),
	);

	if (!contentMd) {
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

	let attempt = 0;
	let originalSnippet: string | null = null;
	let replacementSnippet: string | null = null;

	while (attempt < 12) {
		const result = await runAttempt({
			contentMd,
			suggestionContent,
			heliconeHeaders,
			currentOriginalSnippet: originalSnippet,
			attempt,
		});
		originalSnippet = result.originalSnippet;
		replacementSnippet = result.replacementSnippet;

		if (result.success) {
			break;
		}

		if (attempt > 3) {
			// Start lopping off the last 32 characters of the original snippet
			originalSnippet = originalSnippet.slice(0, -32);
		}

		attempt++;
	}

	return NextResponse.json({
		originalSnippet,
		replacementSnippet,
	} satisfies ApplyChangePostResponse);
};
