import { BrowserWindow, screen, app, ipcMain } from "electron";
import { join } from "path";
import { config } from "./config.js";

const POPUP_DIMS = {
	width: 600,
	height: 180,
};

export const createPopupWindow = async () => {
	const window = new BrowserWindow({
		width: POPUP_DIMS.width,
		height: POPUP_DIMS.height,
		x: 0,
		y: 0,
		resizable: false,
		alwaysOnTop: true,
		transparent: true,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			devTools: config.isDev,
			contextIsolation: false,
		},
		frame: false,
		icon: config.icon,
		title: config.appName,
		show: false,
		skipTaskbar: true,
		movable: false,
		focusable: true,
		maximizable: false,
		minimizable: false,
		fullscreenable: false,
		type: "panel",
	});

	if (process.platform === "darwin") {
		window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		app.dock.hide();
	} else if (process.platform === "win32") {
		window.setAlwaysOnTop(true, "screen-saver");
	}

	await window.loadURL(
		config.isDev
			? "http://localhost:3000/popup"
			: `file://${join(__dirname, "..", "../build/index.html/popup")}`,
	);

	window.hide();

	window.on("close", (e) => {
		if (!config.isQuiting) {
			e.preventDefault();
			window.hide();
		}
	});

	window.on("blur", () => {
		window.hide();
	});

	window.webContents.on("before-input-event", (event, input) => {
		if (input.key === "Escape") {
			window.hide();
		}
	});

	ipcMain.on("update-popup-size", (event, size) => {
		const { width, height } = size;
		window.setSize(width, height);
		centerPopupWindow(window);
	});

	return window;
};

export const showPopupWindow = () => {
	const window = BrowserWindow.getAllWindows().find(
		(w) =>
			w.getTitle() === config.appName &&
			w.webContents.getURL().includes("/popup"),
	);
	if (window) {
		const currentDisplay = screen.getDisplayNearestPoint(
			screen.getCursorScreenPoint(),
		);
		const { width, height, x, y } = currentDisplay.workArea;

		window.setPosition(
			Math.floor(x + width / 2 - POPUP_DIMS.width / 2),
			Math.floor(y + height / 4 - POPUP_DIMS.height / 2),
		);
		window.show();
		window.focus();
	} else {
		console.error("Popup window not found");
	}
};

export const centerPopupWindow = (window) => {
	const currentDisplay = screen.getDisplayNearestPoint(
		screen.getCursorScreenPoint(),
	);
	const { width, height, x, y } = currentDisplay.workArea;
	const [windowWidth, windowHeight] = window.getSize();

	window.setPosition(
		Math.floor(x + width / 2 - windowWidth / 2),
		Math.floor(y + height / 4 - windowHeight / 2),
	);
};

