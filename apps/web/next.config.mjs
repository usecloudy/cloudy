import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
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
		return {
			beforeFiles: [
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
				{
					source: "/static/:path*",
					destination: "http://localhost:3000/static/:path*",
				},
			],
			fallback: [
				{
					source: "/:path*",
					destination: "https://usecloudyai.webflow.io/:path*",
				},
			],
		};
	},

	// This is required to support PostHog trailing slash API requests
	skipTrailingSlashRedirect: true,
};

const config = withPlugins([[withBundleAnalyzer({ enabled: env.ANALYZE })]], baseConfig);

export default withSentryConfig(config, {
	// For all available options, see:
	// https://github.com/getsentry/sentry-webpack-plugin#options

	org: "brain-fog",
	project: "cloudy-web",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Automatically annotate React components to show their full name in breadcrumbs and session replay
	reactComponentAnnotation: {
		enabled: true,
	},

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	tunnelRoute: "/monitoring",

	// Hides source maps from generated client bundles
	hideSourceMaps: true,

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,
});
