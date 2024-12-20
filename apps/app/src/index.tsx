import * as amplitude from "@amplitude/analytics-browser";
import "@cloudy/ui/styles/codeThemes.css";
import "@cloudy/ui/styles/tailwind.css";
import * as Sentry from "@sentry/react";
import { QueryClientProvider } from "@tanstack/react-query";
import posthog from "posthog-js";
import React from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";

import { queryClient } from "./api/queryClient";
import { ToastContainer } from "./components/Toast";
import { TooltipProvider } from "./components/Tooltip";
import { Router } from "./router";
import { ThemeProvider } from "./stores/theme";
import "./styles/fonts.css";
import { SidebarProvider } from "./views/navigation/SidebarProvider";

Sentry.init({
	dsn: "https://a5a720025849f8ad5b65e97d39672568@o4507776484179968.ingest.us.sentry.io/4507776487391232",
	integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
	// Tracing
	tracesSampleRate: 1.0, //  Capture 100% of the transactions
	// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
	tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
	// Session Replay
	replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
	replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

amplitude.init(process.env.NODE_ENV === "production" ? "6d14f14501c1f88da608c5b493ea0c00" : "", {
	autocapture: { elementInteractions: true },
});

posthog.init(process.env.REACT_APP_POSTHOG_KEY!, {
	api_host: process.env.REACT_APP_API_BASE_URL! + "/ingest",
	ui_host: "https://us.posthog.com",
	person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
	session_recording: {
		maskTextSelector: "*", // Masks all text elements (not including inputs)
	},
});

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
	<React.StrictMode>
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<SidebarProvider>
						<Router />
					</SidebarProvider>
				</TooltipProvider>
				<ToastContainer />
			</QueryClientProvider>
		</ThemeProvider>
	</React.StrictMode>,
);
