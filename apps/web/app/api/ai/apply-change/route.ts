import { ApplyChangePostRequestBody, extractInnerTextFromXml, handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { CoreMessage, streamText } from "ai";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { heliconeAnthropic } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: Request) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as ApplyChangePostRequestBody;

	return applyChange(payload, supabase);
};

const makeApplyOriginalSnippetPrompts = ({
	contentHtml,
	suggestionContent,
	currentOriginalSnippet,
}: {
	contentHtml: string;
	suggestionContent: string;
	currentOriginalSnippet: string | null;
}): CoreMessage[] => [
	{
		role: "system",
		content: `You are Cloudy, an amazing writing tool that helps users write.

You will be asked to convert a markdown change into HTML to be applied to the original document html.
- The original snippet and replacement snippet is the input you would place into a .replace() call for a string, where the original snippet is the string to be replaced and the replacement snippet is the string to replace it with.
- Each of them will be subsets of the original document html you want to apply the change to. The original snippet must EXACTLY match a subset of the original document html.
- Some requested changes could be malformed, so you should try to correct them.
- You can create code blocks with <pre><code class="language-[language]">...</code></pre>, it cannot be nested, so create them at the root level. Also, don't include a prefix newline after the opening <code> tag, as that newline will be included in the snippet.

<example_1>
For example, given this document in html format:
\`\`\`
<h1>This is a header.</h1><p>This is a paragraph.</p>
<p>This is another paragraph.</p>
<h2>This is another header.</h2>
<p>This is the next section's paragraph.</p>
\`\`\`

And this requested change, in markdown format:
\`\`\`
<original_snippet>
# This is a header.

This is a paragraph.
</original_snippet>
<replacement_snippet>
## This is a replacement header.

This is a replacement paragraph.
</replacement_snippet>
\`\`\`

Convert the markdown change into HTML to be applied to the original document html.
Return the corrected original HTML snippet, maintaining the same html formatting as the original document html, and replacement HTML snippet for the html:
\`\`\`
<original_snippet>
<h1>This is a header.</h1><p>This is a paragraph.</p>
</original_snippet>
<replacement_snippet>
<h2>This is a replacement header.</h2><p>This is a replacement paragraph.</p>
</replacement_snippet>
</example_1>

<example_2>
For example, given this document in html format:
\`\`\`
<h1>This is a header.</h1><p>This is a paragraph.</p>
<p>This is another paragraph.</p>
<h2>This is another header.</h2>
<p>This is the next section's paragraph.</p>
\`\`\`

And this requested change, in markdown format:
\`\`\`
<original_snippet>
This is header.

This is a paragraph.
</original_snippet>
<replacement_snippet>
## This is a replacement header.

This is a replacement paragraph.
</replacement_snippet>
\`\`\`

Convert the markdown change into HTML to be applied to the original document html.
Return the corrected original HTML snippet, maintaining the same html formatting as the original document html, and replacement HTML snippet for the html:
\`\`\`
<original_snippet>
<h1>This is a header.</h1><p>This is a paragraph.</p>
</original_snippet>
<replacement_snippet>
<h2>This is a replacement header.</h2><p>This is a replacement paragraph.</p>
</replacement_snippet>
</example_2>\`\`\``,
	},
	{
		role: "user",
		content: [
			{
				type: "text",
				text: `Here is the document the user is writing, in html format:
\`\`\`
${contentHtml}
\`\`\`

And this requested change, in markdown format:
\`\`\`
${suggestionContent}
\`\`\`

Convert the markdown change into HTML to be applied to the original document html.
Return the corrected original HTML snippet, maintaining the same html formatting as the original document html, and replacement HTML snippet for the html:`,
				experimental_providerMetadata: {
					anthropic: { cacheControl: { type: "ephemeral" } },
				},
			},
		],
	},
	{
		role: "assistant",
		content: `\`\`\`
<original_snippet>${currentOriginalSnippet ? "\n" + currentOriginalSnippet : ""}`,
	},
];

const runAttempt = async ({
	contentHtml,
	suggestionContent,
	heliconeHeaders,
	currentOriginalSnippet,
	attempt,
}: {
	contentHtml: string;
	suggestionContent: string;
	heliconeHeaders: Record<string, string>;
	currentOriginalSnippet: string | null;
	attempt: number;
}) => {
	const abortController = new AbortController();

	const { textStream } = await streamText({
		model: heliconeAnthropic.languageModel("claude-3-haiku-20240307", { cacheControl: true }),
		messages: makeApplyOriginalSnippetPrompts({ contentHtml, suggestionContent, currentOriginalSnippet }),
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
			const newOriginalSnippet = text.split("</original_snippet>")[0]?.trim().replaceAll("\n", "") ?? "";

			if (!contentHtml.includes(newOriginalSnippet)) {
				abortController.abort();
				return { originalSnippet, replacementSnippet: null, success: false };
			}

			originalSnippet = newOriginalSnippet;
		}
	}

	originalSnippet =
		extractInnerTextFromXml("<original_snippet>" + text, "original_snippet")
			?.trim()
			.replaceAll("\n", "") ?? "";
	const replacementSnippet = extractInnerTextFromXml(text, "replacement_snippet")?.trim();

	return { originalSnippet, replacementSnippet: replacementSnippet ?? null, success: true };
};

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

	let attempt = 0;
	let originalSnippet: string | null = null;
	let replacementSnippet: string | null = null;

	while (attempt < 12) {
		const result = await runAttempt({
			contentHtml,
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
	});
};
