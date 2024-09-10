import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export async function register() {
	const exporter = new LangfuseExporter({
		baseUrl: "https://us.cloud.langfuse.com",
		flushInterval: 5000,
	});
	registerOTel({
		serviceName: "cloudy",
		traceExporter: exporter,
	});

	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./sentry.server.config");
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}
}
