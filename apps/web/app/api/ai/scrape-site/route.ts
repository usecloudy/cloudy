import { generateObject } from "ai";
import * as dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { heliconeOpenAI, makeHeliconeHeaders } from "app/api/utils/helicone";
import { setupPuppeteer } from "app/api/utils/puppeteer";
import { getSupabase } from "app/api/utils/supabase";

dotenv.config();

async function scrapeSite(url: string, maxPages = 10): Promise<string> {
	const browser = await setupPuppeteer();
	const page = await browser.newPage();

	const visited = new Set<string>();
	const contentList: string[] = [];

	async function scrapePage(currentUrl: string) {
		if (visited.size >= maxPages || visited.has(currentUrl)) {
			return;
		}

		visited.add(currentUrl);
		await page.goto(currentUrl, { waitUntil: "domcontentloaded" });

		const content = await page.evaluate(() => document.body.innerText);
		contentList.push(content);

		const links = await page.evaluate(() =>
			Array.from(document.querySelectorAll("a"))
				.map(a => (a as HTMLAnchorElement).href)
				// eslint-disable-next-line no-restricted-globals
				.filter(href => href.startsWith(location.origin)),
		);

		for (const link of links) {
			if (!visited.has(link)) {
				await scrapePage(link);
			}
			if (visited.size >= maxPages) {
				break;
			}
		}
	}

	await scrapePage(url);
	await browser.close();

	return contentList.join("\n");
}

async function getAIResponse(content: string) {
	const maxContentLength = 10000;
	const contentSnippet = content.substring(0, maxContentLength);

	const fullPrompt = `${contentSnippet}\n\nBased on the above content, please extract the needed information. If any information is not available, please return "UNKNOWN".`;

	const response = await generateObject({
		model: heliconeOpenAI("gpt-4o-mini"),
		prompt: fullPrompt,
		maxTokens: 1024,
		temperature: 0.0,
		schema: z.object({
			companyName: z
				.string()
				.describe(
					"The name of the company, does not have to be the actual legal name but the main name. For example, if the company is called 'Acme Inc.', but their website often refers to them as 'Big Acme', then return 'Big Acme'.",
				),
			companyMission: z.string(),
			companyIndustry: z.string(),
			companySummary: z.string(),
			companyStage: z.string().describe("The stage of the company, for example 'Series A' or 'Pre-seed'"),
			companyMarketType: z.string().describe("The market type of the company, for example 'B2B' or 'B2C'"),
			companyWelcomeMessage: z
				.string()
				.describe(
					'Formulate a friendly markdown welcome message with the company and its mission, for example "Hey there **Big Enterprise**! Looks like you ... ."',
				),
			companyBlurb: z
				.string()
				.describe(
					'A blurb about the company and its mission, your goal is to give a very detailed description of what the company does. This will be used to inform an AI assistant for the company. Describe the company in great detail, start with, for example, "Big Enterprise is a ..."',
				),
		}),
		headers: makeHeliconeHeaders({
			sessionName: "scrape-site",
		}),
	});

	const missionBlurb = response.object.companyBlurb === "UNKNOWN" ? null : response.object.companyBlurb;
	let collectionNames = ["Ideation", "Meeting Notes", "Product Roadmap", "Hiring", "Onboarding"];
	if (missionBlurb) {
		const { object } = await generateObject({
			model: heliconeOpenAI("gpt-4o-mini"),
			schema: z.object({
				collectionNames: z
					.array(z.string())
					.describe("A list of 5-7 high-level generic collection names that would be relevant for this company."),
			}),
			prompt: `Select 5-7 collection names from the following list of high-level generic collection names that would be relevant for this company. Keep the names high level and generalizable.

# Collection name bank
Good examples for collection names include
- Sales: For b2b companies
- Customer Interviews: For early stage b2b companies
- Content Strategy: For b2c companies
- Tech Specs: For technical companies
- Ideation: For creative companies
- Meeting Notes: For any company
- Product Roadmap: For tech companies
- Hiring: For any company
- Onboarding: For any company
- ...

# Output Format

- Provide generic collection names for the company's notes. Each name should be a generic collection name that would be relevant for this company. See the examples above for inspiration.

\`\`\`${response.object.companyStage} ${response.object.companyMarketType}\n
${missionBlurb}
\`\`\``,
		});
		collectionNames = object.collectionNames;
	}

	return {
		name: response.object.companyName === "UNKNOWN" ? null : response.object.companyName,
		welcomeMessage: response.object.companyWelcomeMessage === "UNKNOWN" ? null : response.object.companyWelcomeMessage,
		missionBlurb,
		collectionNames,
	};
}

export const maxDuration = 45;

export async function GET(req: NextRequest) {
	await getSupabase({ request: req, mode: "client" });
	const url = req.nextUrl.searchParams.get("url");

	if (!url) {
		return NextResponse.json({ error: "No URL provided" }, { status: 400 });
	}

	console.log("url", url);

	const maxPages = 8;

	console.log("Scraping the site...");
	const siteContent = await scrapeSite(url, maxPages);

	console.log("Processing with AI...");
	const aiResponse = await getAIResponse(siteContent);

	console.log("AI Response:", aiResponse);

	return NextResponse.json(aiResponse);
}
