import { ThoughtsExportGetRequestBody, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest } from "next/server";

import { loadFont, setupPuppeteer } from "app/api/utils/puppeteer";
import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 30;

export const GET = async (req: NextRequest, { params: { thoughtId } }: { params: { thoughtId: string } }) => {
	const supabase = await getSupabase({ request: req, mode: "client" });

	const thought = handleSupabaseError(await supabase.from("thoughts").select("title, content").eq("id", thoughtId).single());

	await loadFont();

	const browser = await setupPuppeteer();
	const page = await browser.newPage();

	const searchParams = req.nextUrl.searchParams;
	const options = JSON.parse(searchParams.get("options") ?? "{}") as ThoughtsExportGetRequestBody;

	console.log("options", options);

	const logoPng = await fetch(
		"https://www.usecloudy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.b000b256.png&w=256&q=75",
	).then(res => res.arrayBuffer());
	const base64Logo = Buffer.from(logoPng).toString("base64");

	const contentHTML = `
		<!DOCTYPE html>
		<html lang="en" class="${options.colorScheme === "white" ? "colorSchemeWhite" : "colorSchemeDefault"}">
			<head>
				${head}
			</head>
			<body>
				${options.hideTitle ? "" : `<h1>${thought.title}</h1>`}
				<div>${thought.content}</div>
			</body>
		</html>
	`;

	await page.setContent(contentHTML ?? "");

	await page.addStyleTag({ content: getExportStyle(options) });

	const footerHtml = `
    <!DOCTYPE html>
		<html lang="en">
			<head>
                <style>${getFooterCss(options)}</style>
			</head>
			<body>
                <div class="bg"></div>
				<div class="watermark"><span>written with Cloudy</span><div class="logoContainer"><img class="logo" src="data:image/png;base64,${base64Logo}" /></div><span>usecloudy.com</span></div>
			</body>
		</html>
    `;

	const pdfBuffer = await page.pdf({
		format: options.paperSize ?? "a4",
		printBackground: true,
		margin: { top: 60, left: 60, right: 60, bottom: 60 },
		displayHeaderFooter: true,
		headerTemplate: `<div></div>`,
		footerTemplate: options.hideWatermark ? `<div></div>` : footerHtml,
	});

	await browser.close();

	const encodedFilename =
		options.fileName ?? encodeURIComponent((thought.title?.replace(/[^a-zA-Z0-9-_]/g, "_") || "exported-note") + ".pdf");

	return new Response(pdfBuffer, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
		},
	});
};

const getFooterCss = (options: ThoughtsExportGetRequestBody) => {
	return `
    html {
        -webkit-print-color-adjust: exact;
        font-family: "Noto Sans", Helvetica, Arial, sans-serif, system-ui;
    }
        
    .watermark {
        position: fixed;
        bottom: 6pt;
        left: 0;
        width: 100vw;
        display: flex;
        justify-content: space-between;
        padding: 0 16pt;
        box-sizing: border-box;
        align-items: center;
        text-align: center;
        font-size: 10pt;
        color: rgb(177 175 172);
    }

    .logoContainer {
        position: fixed;
        left: 0pt;
        bottom: 6pt;
        width: 100vw;
        display: flex;
        justify-content: center;
        padding: 0 16pt;
        box-sizing: border-box;
        align-items: center;
    }

    .logo {
        width: 22pt;
        height: 22pt;
        object-fit: contain;
        ${options.colorScheme === "white" ? "filter: grayscale(100%) brightness(0); opacity: 0.2;" : ""}
    }
`.replaceAll("\n", "");
};
const head = `
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="apple-touch-icon" sizes="180x180" href="%PUBLIC_URL%/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="%PUBLIC_URL%/favicon-16x16.png">
<link rel="manifest" href="%PUBLIC_URL%/site.webmanifest">
<link rel="mask-icon" href="%PUBLIC_URL%/safari-pinned-tab.svg" color="#5d46b8">
<meta name="msapplication-TileColor" content="#fff5e1">
<meta name="theme-color" content="rgb(232, 231, 229)">
<meta name="color-scheme" content="light only">
<meta name="viewport" content="width=device-width, user-scalable=no" />


<link rel="stylesheet" href="https://use.typekit.net/bfg4lqw.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
	href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif+Display:ital,wght@0,100..900;1,100..900&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap"
	rel="stylesheet">
`;

const getExportStyle = (options: ThoughtsExportGetRequestBody) => {
	return `
.colorSchemeDefault {
    color: rgb(11 11 11);
}

.colorSchemeWhite {
    color: rgb(11 11 11);
}

html {
  -webkit-print-color-adjust: exact;
}

body {
    --color-card: rgb(224 221 217);
    
	font-family: "Noto Sans", sans-serif;
	font-size: ${options.fontSizePt ?? 11}pt;
	line-height: 1.3;
	letter-spacing: 0.005rem;
	font-feature-settings: "rlig" 1, "calt" 1;
    
    div {
        z-index: 100;
    }

    > * + * {
        margin: 0.33rem 0;
    }

    .indent {
        padding-inline: 1rem 0;
    }

    .indent-level-2 {
        padding-inline: 2rem 0;
    }

    .indent-level-3 {
        padding-inline: 3rem 0;
    }

    p.is-editor-empty:first-child::before {
        color: hsl(var(--muted-foreground));
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }

    :first-child {
        margin-top: 0;
    }

    ul,
    ol {
        padding: 0 1rem;
        margin: 0;
    }

    ol {
        list-style-type: decimal;
    }

    ul {
        list-style-type: disc;
    }

    li p {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
    }

    li.editor-class-list {
        list-style-type: none;
    }

    li.editor-task-item {
        gap: 0.25rem;
        display: flex;
        flex-direction: row;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        line-height: 1.1;
        margin-top: 1rem;
        font-weight: 700;
        text-wrap: pretty;
		letter-spacing: -0.005em;
    }

    h1,
    h2 {
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 1.6rem;
    }

    h2 {
        font-size: 1.4rem;
    }

    h3 {
        font-size: 1.2rem;
    }

    h4,
    h5,
    h6 {
        font-size: 1rem;
    }

    code {
        background-color: var(--color-card);
        font-family: "JetBrainsMono", monospace;
        border-radius: 0.4rem;
        color: var(--black);
        font-size: 0.85rem;
        padding: 0.25em 0.3em;
    }

    pre {
        background-color: var(--color-card);
        border-radius: 0.5rem;
        color: var(--white);
        font-family: "JetBrainsMono", monospace;
        margin: 1.5rem 0;
        padding: 0.75rem 1rem;
    }

    pre code {
        background-color: var(--color-card);
        font-family: "JetBrainsMono", monospace;
        color: inherit;
        font-size: 0.8rem;
        padding: 0;
    }

    mark {
        background-color: #faf594;
        border-radius: 0.4rem;
        box-decoration-break: clone;
        padding: 0.1rem 0.3rem;
    }

    blockquote {
        border-left: 3px solid var(--gray-3);
        margin: 1.5rem 0;
        padding-left: 1rem;
    }

    hr {
        border: none;
        border-top: 1px solid var(--gray-2);
        margin: 2rem 0;
    }

    p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }
}
`;
};
