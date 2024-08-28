import { join, dirname } from "path";
import isDev from "electron-is-dev";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export let config = {
	appName: "Electron React Tailwind Template",
	icon: join(__dirname, "..", "/favicon.ico"),
	tray: null,
	isQuiting: false,
	mainWindow: null,
	popupWindow: null,
	isDev,
};

