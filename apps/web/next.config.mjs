import withBundleAnalyzer from "@next/bundle-analyzer";
import withPlugins from "next-compose-plugins";

import { env } from "./env.mjs";

/**
 * @type {import('next').NextConfig}
 */
const baseConfig = {
	reactStrictMode: true,
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
	experimental: { instrumentationHook: true, serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium"] },
	rewrites() {
		return [
			{ source: "/healthz", destination: "/api/health" },
			{ source: "/api/healthz", destination: "/api/health" },
			{ source: "/health", destination: "/api/health" },
			{ source: "/ping", destination: "/api/health" },
			{
				source: "/ingest/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://us.i.posthog.com/:path*",
			},
			{
				source: "/ingest/decide",
				destination: "https://us.i.posthog.com/decide",
			},
		];
	},

	// This is required to support PostHog trailing slash API requests
	skipTrailingSlashRedirect: true,
};

const config = withPlugins([[withBundleAnalyzer({ enabled: env.ANALYZE })]], baseConfig);

export default config;
