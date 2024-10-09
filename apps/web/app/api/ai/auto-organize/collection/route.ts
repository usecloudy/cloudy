import { handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest, NextResponse } from "next/server";

import { getSupabase } from "app/api/utils/supabase";

import { generateNoteQueries, queryNotes } from "../utils";

export const POST = async (req: NextRequest) => {
	const { collectionId, workspaceId } = await req.json();

	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service", bypassAuth: true });

	const { title: collectionTitle } = handleSupabaseError(
		await supabase.from("collections").select("title").eq("id", collectionId).single(),
	);

	if (!collectionTitle) {
		return NextResponse.json({ error: "Collection title not found" }, { status: 404 });
	}

	const noteQueries = await generateNoteQueries(collectionTitle);

	console.log("noteQueries", noteQueries);

	const notes = await queryNotes(collectionTitle, noteQueries, workspaceId, collectionId, supabase);

	return NextResponse.json({ notes });
};
