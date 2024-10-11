import { generateObject, generateText } from "ai";
import * as dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { z } from "zod";

import { heliconeOpenAI, makeHeliconeHeaders } from "app/api/utils/helicone";

dotenv.config();

async function scrapeSite(url: string, maxPages = 10): Promise<string> {
	const browser = await puppeteer.launch();
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
			companyWelcomeMessage: z
				.string()
				.describe(
					'Formulate a friendly markdown welcome message with the company and its mission, for example "Hey there **Big Enterprise**! Looks like you ... ."',
				),
		}),
		headers: makeHeliconeHeaders({
			sessionName: "scrape-site",
		}),
	});

	// 	const textResponse = await generateText({
	// 		model: heliconeOpenAI("gpt-4o-mini"),
	// 		prompt: `Given the following company's information, what would be a reasonable set of folders and files they would have in their internal notetaking app, be pretty specific with the folder names.

	// ${JSON.stringify(response.object)}`,
	// 		maxTokens: 512,
	// 		temperature: 0.0,
	// 	});

	// 	console.log("Text Response:", textResponse.text);

	return {
		name: response.object.companyName === "UNKNOWN" ? null : response.object.companyName,
		welcomeMessage: response.object.companyWelcomeMessage === "UNKNOWN" ? null : response.object.companyWelcomeMessage,
	};
}

export async function GET(req: NextRequest) {
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
