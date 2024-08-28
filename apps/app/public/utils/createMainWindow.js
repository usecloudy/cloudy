import { BrowserWindow } from "electron";
import { join } from "path";
import { config } from "./config.js";

export const createMainWindow = async () => {
	const window = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			devTools: config.isDev,
			contextIsolation: false,
		},
		icon: config.icon,
		titleBarStyle: "hidden",
		title: config.appName,
	});

	await window.loadURL(
		config.isDev
			? "http://localhost:3000/"
			: `file://${join(__dirname, "..", "../build/index.html#/")}`,
	);

	window.on("close", (e) => {
		if (!config.isQuiting) {
			e.preventDefault();

			window.hide();
		}
	});

	return window;
};

