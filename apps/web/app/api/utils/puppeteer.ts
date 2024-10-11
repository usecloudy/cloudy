import chromium from "@sparticuz/chromium";
import puppeteer, { Browser } from "puppeteer-core";

// Optional: If you'd like to use the new headless mode. "shell" is the default.
// NOTE: Because we build the shell binary, this option does not work.
//       However, this option will stay so when we migrate to full chromium it will work.
chromium.setHeadlessMode = true;

// Optional: If you'd like to disable webgl, true is the default.
chromium.setGraphicsMode = false;

// You may want to change this if you're developing
// on a platform different from macOS.
// See https://github.com/vercel/og-image for a more resilient
// system-agnostic options for Puppeteeer.
const LOCAL_CHROME_EXECUTABLE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const setupPuppeteer = async (): Promise<Browser> => {
	const isProduction = process.env.NODE_ENV === "production";
	const executablePath = isProduction ? await chromium.executablePath() : LOCAL_CHROME_EXECUTABLE;

	return puppeteer.launch({
		executablePath,
		defaultViewport: isProduction ? chromium.defaultViewport : undefined,
		args: isProduction ? chromium.args : [],
		headless: true,
	});
};

export const loadFont = async () => {
	await chromium.font("https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5ardu3mhPy1Fig.woff2");
};
