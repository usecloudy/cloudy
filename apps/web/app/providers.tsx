"use client";

import { ThemeProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
		api_host: "/ingest",
		ui_host: "https://us.posthog.com",
		person_profiles: "identified_only",
		capture_pageview: false, // Disable automatic pageview capture, as we capture manually
		capture_pageleave: true, // Enable pageleave capture
		session_recording: {
			maskTextSelector: "*", // Masks all text elements (not including inputs)
		},
	});
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
	return (
		<PostHogProvider client={posthog}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				{children}
			</ThemeProvider>
		</PostHogProvider>
	);
};
