import { handleSupabaseError, makeHumanizedTime } from "@cloudy/utils/common";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { heliconeOpenAI } from "app/api/utils/helicone";
import { getSupabase } from "app/api/utils/supabase";

export const POST = async (req: NextRequest) => {
	const supabase = getSupabase({ authHeader: req.headers.get("Authorization"), mode: "service", bypassAuth: true });
	const { collectionId } = await req.json();

	// Fetch collection title
	const { title: collectionTitle } = handleSupabaseError(
		await supabase.from("collections").select("title").eq("id", collectionId).single(),
	);

	// Fetch notes in the collection
	const notes = handleSupabaseError(
		await supabase
			.from("collection_thoughts")
			.select("thoughts(title, content_md, updated_at)")
			.eq("collection_id", collectionId)
			.order("updated_at", { referencedTable: "thoughts", ascending: true }),
	).flatMap(n => (n.thoughts ? [n.thoughts] : []));

	// Generate summary using AI
	const { object: summary } = await generateObject({
		model: heliconeOpenAI.languageModel("gpt-4o-mini-2024-07-18", { structuredOutputs: true }),
		messages: [
			{
				role: "system",
				content: `Summarize the key takeaways from a collection of notes provided in a folder. These notes may encompass various topics and formats, and your task is to distill them into a concise summary that captures the main points and insights.

# Steps

1. **Review Notes**: Go through each note to understand the content and context.
2. **Identify Key Points**: Highlight the main ideas, recurring themes, and any important data or conclusions from the notes.
3. **Synthesize Information**: Organize the findings into thematic categories or a logical sequence.
4. **Draft Summary**: Create a cohesive summary that encapsulates the key takeaways from the notes.

# Output Format

- Provide a structured summary in paragraph form.
- Keep it concise, ideally within 1-2 paragraphs.
- Use bullet points for clarity if necessary; each point should represent a key takeaway.

# Examples

**Example 1**

*Input*: Folder contains notes on "Project X Development"
- Note 1: Discusses timeline and deadlines.
- Note 2: Outlines key challenges faced.

*Output*: 
The development of Project X is on a tight timeline with several upcoming deadlines. Key challenges include resource allocation and technical hurdles that need addressing.

(**Note**: Real folders may have more detailed notes, requiring longer summaries with more comprehensive insights.)
- Don't include meta words like "The notes in this folder are about..." or "These notes are about...", just get to the point. No yapping.
- The notes are sorted by the date they were last updated, so the most recent note is at the bottom.

# Notes

- Pay attention to the consistency of terms and concepts used across different notes.
- Be mindful of the context for each point, ensuring the summary accurately reflects the original content's intent.`,
			},
			{
				role: "user",
				content: `The collection of notes titled "${collectionTitle}" are as follows:

${notes.map(note => `Title: ${note.title}\nLast updated at: ${makeHumanizedTime(note.updated_at)}\n${note.content_md}`).join("\n\n")}`,
			},
		],
		schema: z.object({
			keyTakeaways: z.array(z.string()).describe("Key takeaways from the collection"),
			summary: z.string().describe("A concise summary of the collection"),
			latestUpdate: z.string().describe("An executive summary of the latest update in the topic."),
		}),
	});

	handleSupabaseError(
		await supabase
			.from("collections")
			.update({ summary, summary_updated_at: new Date().toISOString() })
			.eq("id", collectionId),
	);

	return NextResponse.json(summary);
};
