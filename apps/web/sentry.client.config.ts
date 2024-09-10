// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://0198fa36338dd14a4af905decbfc442b@o4507776484179968.ingest.us.sentry.io/4507915817910272",

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,
	enabled: process.env.NODE_ENV === "production",
});
