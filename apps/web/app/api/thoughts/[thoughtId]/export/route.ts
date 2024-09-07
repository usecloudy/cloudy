import { ThoughtsExportGetRequestBody, handleSupabaseError } from "@cloudy/utils/common";
import { NextRequest } from "next/server";
import puppeteer from "puppeteer";

import { getSupabase } from "app/api/utils/supabase";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = async (req: NextRequest, { params: { thoughtId } }: { params: { thoughtId: string } }) => {
	const supabase = getSupabase({ authHeader: "Bearer labu-labu-labubu", mode: "service" });

	const thought = handleSupabaseError(await supabase.from("thoughts").select("title, content").eq("id", thoughtId).single());

	const browser = await puppeteer.launch({ headless: true });

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
		<html lang="en">
			<head>
				${head}
			</head>
			<body class="${options.colorScheme === "white" ? "colorSchemeWhite" : "colorSchemeDefault"}">
				${options.hideTitle ? "" : `<h1>${thought.title}</h1>`}
				<div>${thought.content}</div>
                ${options.hideWatermark ? "" : `<div class="watermark"><span>written with Cloudy</span><div class="logoContainer"><img class="logo" src="data:image/png;base64,${base64Logo}" /></div><span>usecloudy.com</span></div>`}
			</body>
		</html>
	`;
	await page.setContent(contentHTML ?? "");

	await page.addStyleTag({ content: getExportStyle(options) });

	const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

	await browser.close();

	return new Response(pdfBuffer, {
		headers: {
			"Content-Type": "application/pdf",
		},
	});
};

const logoGreySvg = `<svg class="logo" width="324" height="282" viewBox="0 0 324 282" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M318.072 249.068C318.072 267.115 303.442 281.745 285.395 281.745C267.348 281.745 252.718 267.115 252.718 249.068C252.718 231.021 267.348 216.391 285.395 216.391C303.442 216.391 318.072 231.021 318.072 249.068Z" fill="#B1AFAC"/>
<path d="M141.04 141.523C143.755 180.272 114.545 213.884 75.7962 216.599C37.0479 219.314 3.43522 190.104 0.720214 151.355C-1.99479 112.607 27.216 78.9942 65.9644 76.2792C104.713 73.5642 138.325 102.775 141.04 141.523Z" fill="#B1AFAC"/>
<path d="M323.246 114.441C326.491 160.761 291.572 200.941 245.253 204.187C198.933 207.432 158.752 172.514 155.506 126.194C152.261 79.8741 187.18 39.6934 233.499 36.4479C279.819 33.2023 320 68.121 323.246 114.441Z" fill="#B1AFAC"/>
<path d="M243.724 85.9761C247.281 136.75 209.005 180.794 158.231 184.352C107.458 187.909 63.4135 149.633 59.8559 98.8592C56.2983 48.0856 94.5746 4.04135 145.348 0.48376C196.122 -3.07383 240.166 35.2024 243.724 85.9761Z" fill="#B1AFAC"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M252.917 203.31C250.399 203.718 236.093 168.436 233.499 168.617C208.395 170.376 201.382 162.881 184.787 146.479C177.798 148.742 156.641 163.981 148.983 164.518C138.051 165.284 111.944 181.277 101.973 178.457C90.7085 198.159 94.8601 214.735 70.5201 216.44C68.6831 216.569 66.8572 216.626 65.0459 216.613C96.1318 218.127 127.433 217.811 158.795 215.613C190.551 213.388 221.975 209.263 252.917 203.31Z" fill="#B1AFAC"/>
</svg>`;

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
    background-color: rgb(232 231 229);
    color: rgb(11 11 11);
}

.colorSchemeWhite {
    background-color: rgb(255 255 255);
    color: rgb(11 11 11);
}

body {
    --color-card: rgb(224 221 217);
    
    padding: 60pt;
	font-family: "Noto Sans", sans-serif;
	font-size: ${options.fontSizePt ?? 11}pt;
	line-height: 1.3;
	letter-spacing: 0.005rem;
	font-feature-settings: "rlig" 1, "calt" 1;

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
}
`;
};