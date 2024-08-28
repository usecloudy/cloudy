import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import { createMainWindow } from "./utils/createMainWindow.js";
import {
	createPopupWindow,
	showPopupWindow,
} from "./utils/createPopupWindow.js";
import { showNotification } from "./utils/showNotification.js";
import AutoLaunch from "auto-launch";
import { config } from "./utils/config.js";
import Store from "electron-store";

// if (config.isDev) import("electron-reloader")(module);

if (!config.isDev) {
	const autoStart = new AutoLaunch({
		name: config.appName,
	});
	autoStart.enable();
}

Store.initRenderer();

app.on("ready", async () => {
	config.mainWindow = await createMainWindow();
	config.popupWindow = await createPopupWindow();
	config.windows = [config.mainWindow, config.popupWindow];

	globalShortcut.register("Option+Space", () => {
		console.log("Option+Space is pressed");
		if (config.popupWindow?.isVisible()) {
			config.popupWindow.hide();
		} else {
			showPopupWindow();
		}
	});

	showNotification(
		config.appName,
		"Application running on background! See application tray.",
	);
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		config.mainWindow = createMainWindow();
});

ipcMain.on("app_version", (event) => {
	event.sender.send("app_version", { version: app.getVersion() });
});

// Handle broadcasts
ipcMain.on("broadcast", (event, message) => {
	config.windows.forEach((win) => {
		win.webContents.send("broadcast", message);
	});
});

app.on("will-quit", () => {
	globalShortcut.unregisterAll();
});

