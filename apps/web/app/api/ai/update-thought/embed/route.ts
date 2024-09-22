import { handleSupabaseError } from "@cloudy/utils/common";
import { JSDOM } from "jsdom";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service", bypassAuth: true });

	const thoughtId = "514e7aa2-1540-4956-aee3-9555fe848c9f";

	const thought = handleSupabaseError(await supabase.from("thoughts").select("*").eq("id", thoughtId).single());

	const contentMd = thought.content_md;

	console.log("contentMd", contentMd);

	const split = contentMd?.split("\n\n");
	split?.forEach(async item => {
		console.log(item);
	});

	return NextResponse.json({ thought });
};

const embedWithJina = async (inputs: string[]) => {
	const url = "https://api.jina.ai/v1/multi-vector";
	const headers = {
		"Content-Type": "application/json",
		Authorization: "Bearer jina_98a9edcefa21478cbd7b793dbc6ddc3cMmu5nWgIOStmCUhGD7hU-3WA3hhp",
	};

	const data = {
		model: "jina-colbert-v2",
		dimensions: 64,
		input_type: "query",
		embedding_type: "float",
		input: embedWithJina,
	};

	return fetch(url, {
		method: "POST",
		headers: headers,
		body: JSON.stringify(data),
	}).then(response => response.json());
};
