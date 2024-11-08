// app/providers.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// app/providers.tsx

// app/providers.tsx

// app/providers.tsx

// app/providers.tsx

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

export function PHProvider({ children }: { children: React.ReactNode }) {
	return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
