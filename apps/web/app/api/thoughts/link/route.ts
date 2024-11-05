import { handleSupabaseError } from "@cloudy/utils/common";
import { Database } from "@repo/db";
import { SupabaseClient } from "@supabase/supabase-js";
import { kv } from "@vercel/kv";
import { subSeconds } from "date-fns";
import { JSDOM } from "jsdom";
import { NextRequest, NextResponse } from "next/server";

import { withProtectedRoute } from "app/api/utils/supabase";

type ThoughtRecord = Database["public"]["Tables"]["thoughts"]["Row"];

type InsertPayload = {
	type: "INSERT";
	table: string;
	schema: string;
	record: ThoughtRecord;
	old_record: null;
};
type UpdatePayload = {
	type: "UPDATE";
	table: string;
	schema: string;
	record: ThoughtRecord;
	old_record: ThoughtRecord;
};
type DeletePayload = {
	type: "DELETE";
	table: string;
	schema: string;
	record: null;
	old_record: ThoughtRecord;
};

type Payload = InsertPayload | UpdatePayload | DeletePayload;

interface LinkGenerationStatusCache {
	lastGeneratedAt: number;
}

const makeCacheKey = (thoughtId: string) => `thoughts:${thoughtId}:link-generation`;

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const POST = withProtectedRoute(async ({ request, supabase }) => {
	const payload = (await request.json()) as Payload;

	if (payload.type === "DELETE") {
		return NextResponse.json(
			{
				message: "Delete not implemented",
			},
			{ status: 501 },
		);
	}

	if (payload.type === "UPDATE" && payload.record.content === payload.old_record.content) {
		return NextResponse.json({
			message: "Content has not changed",
		});
	}

	const linkGenerationStatus = (await kv.hgetall(makeCacheKey(payload.record.id))) as LinkGenerationStatusCache | null;
	if (!linkGenerationStatus || new Date(linkGenerationStatus.lastGeneratedAt) < subSeconds(new Date(), 1)) {
		await kv.hset(makeCacheKey(payload.record.id), { lastGeneratedAt: Date.now() });
		await handleCreateLinks(payload, supabase);
	} else {
		console.log(`Skipping link generation for ${payload.record.id} because it was generated too recently`);
	}

	return NextResponse.json({
		message: "Link generation status updated",
	});
}, "service");

const handleCreateLinks = async (payload: InsertPayload | UpdatePayload, supabase: SupabaseClient<Database>) => {
	const mentionTags = findMentionTags(payload.record.content ?? "");
	const allLinks = new Set(
		mentionTags
			.map(tag => tag.getAttribute("data-id"))
			.filter(tag => tag !== null && tag !== payload.record.id) as string[],
	);

	const allDbLinks = handleSupabaseError(
		await supabase.from("thought_links").select("*").eq("linked_from", payload.record.id),
	);

	const linksToCreate = Array.from(allLinks).filter(link => !allDbLinks.some(dbLink => dbLink.linked_to === link));

	const linksToDelete = allDbLinks.filter(dbLink => !allLinks.has(dbLink.linked_to));

	console.log(`Deleting ${linksToDelete.length} links and creating ${linksToCreate.length} links`);

	if (linksToDelete.length > 0) {
		handleSupabaseError(
			await supabase
				.from("thought_links")
				.delete()
				.in(
					"id",
					linksToDelete.map(link => link.id),
				),
		);

		console.log(`Deleted ${linksToDelete.length} links`);
	}

	if (linksToCreate.length > 0) {
		handleSupabaseError(
			await supabase.from("thought_links").insert(
				linksToCreate.map(link => ({
					linked_from: payload.record.id,
					linked_to: link,
				})),
			),
		);

		console.log(`Created ${linksToCreate.length} links`);
	}
};

const findMentionTags = (contentHtml: string) => {
	const dom = new JSDOM(contentHtml);
	const doc = dom.window.document;
	const mentionTags = doc.querySelectorAll('a[data-type="mention"]');
	return Array.from(mentionTags);
};
