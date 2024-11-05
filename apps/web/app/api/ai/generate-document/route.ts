import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { __getOctokitDevTokenClient, getOctokitAppClient } from "app/api/utils/github";
import { heliconeAnthropic, heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

interface Payload {
	docId: string;
}

export const maxDuration = 90;

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always run dynamically

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return generateDocument(payload, supabase);
};

const getFileContents = async (docId: string, supabase: SupabaseClient<Database>) => {
	const repoReferences = handleSupabaseError(
		await supabase.from("document_repo_links").select("path, repo_connection_id, type").eq("document_id", docId),
	);

	const results = (
		await Promise.all(
			repoReferences.flatMap(async repoReference => {
				const { installation_id, owner, name } = handleSupabaseError(
					await supabase
						.from("repository_connections")
						.select("installation_id, owner, name")
						.eq("id", repoReference.repo_connection_id)
						.single(),
				);
				const octokit =
					installation_id === "<TOKEN>" ? __getOctokitDevTokenClient() : getOctokitAppClient(installation_id);

				if (repoReference.type === "file") {
					const { data: file } = await octokit.rest.repos.getContent({
						owner,
						repo: name,
						path: repoReference.path,
					});

					if (!Array.isArray(file) && file.type === "file") {
						return [
							{
								path: file.path,
								content: Buffer.from(file.content, "base64").toString("utf-8"),
							},
						];
					}

					return [];
				}

				// TODO: Support directories
				return [];
			}),
		)
	).flat();

	return results;
};

const generateDocument = async (payload: Payload, supabase: SupabaseClient<Database>) => {
	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const { generation_prompt } = handleSupabaseError(
		await supabase.from("thoughts").select("generation_prompt").eq("id", payload.docId).single(),
	);

	if (!generation_prompt) {
		throw new Error("Generation prompt not found");
	}

	const heliconeHeaders = {
		"Helicone-User-Id": userId,
		"Helicone-Session-Name": "Generate Document",
		"Helicone-Session-Id": `generate-document/${randomUUID()}`,
	};

	const files = await getFileContents(payload.docId, supabase);

	const stream = await streamText({
		model: heliconeAnthropic.languageModel("claude-3-5-sonnet-20241022"),
		system: "You are an excellent technical documentation writer. You are given a set of files and a user instruction. You need to write documentation for the files.",
		prompt: `Follow this output format exactly:
\`\`\`title:The title of the document
Here you place the content of the document
...
\`\`\`

Files:
${files.map(file => `\`\`\`path:${file.path}\n${file.content}\n\`\`\``).join("\n")}

User Instruction:
${generation_prompt}`,
		temperature: 0.0,
		experimental_telemetry: {
			isEnabled: true,
		},
		headers: {
			...heliconeHeaders,
			"Helicone-Session-Path": "generate-document",
		},
	});

	return stream.toTextStreamResponse();
};
