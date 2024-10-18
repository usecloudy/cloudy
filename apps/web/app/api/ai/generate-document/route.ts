import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { octokit } from "app/api/utils/github";
import { heliconeAnthropic, heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";
import { getContextForThought } from "app/api/utils/thoughts";

interface Payload {
	thoughtId: string;
}

export const maxDuration = 90;

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always run dynamically

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "client" });

	const payload = (await req.json()) as Payload;

	return generateDocument(payload, supabase);
};

const getFileContents = async () => {
	const results = await Promise.all([
		octokit.rest.repos.getContent({
			owner: "getsentry",
			repo: "seer",
			path: "src/seer/automation/agent/client.py",
		}),
		octokit.rest.repos.getContent({
			owner: "getsentry",
			repo: "seer",
			path: "src/seer/automation/agent/models.py",
		}),
	]);

	return results
		.map(result => result.data)
		.flatMap(file => {
			if (!Array.isArray(file) && file.type === "file") {
				return Buffer.from(file.content, "base64").toString("utf-8");
			}

			return [];
		});
};

const generateDocument = async (payload: Payload, supabase: SupabaseClient<Database>) => {
	const userId = (await supabase.auth.getUser()).data?.user?.id;

	if (!userId) {
		throw new Error("User ID not found");
	}

	const { generation_prompt } = handleSupabaseError(
		await supabase.from("thoughts").select("generation_prompt").eq("id", payload.thoughtId).single(),
	);

	if (!generation_prompt) {
		throw new Error("Generation prompt not found");
	}

	const heliconeHeaders = {
		"Helicone-User-Id": userId,
		"Helicone-Session-Name": "Generate Document",
		"Helicone-Session-Id": `generate-document/${randomUUID()}`,
	};

	const fileContents = await getFileContents();

	const stream = await streamText({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18"),
		system: "You are an excellent technical documentation writer. You are given a set of files and a user instruction. You need to write documentation for the files.",
		prompt: `Files:
${fileContents.join("\n")}

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
