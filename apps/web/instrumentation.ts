import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

export function register() {
	const exporter = new LangfuseExporter({
		baseUrl: "https://us.cloud.langfuse.com",
		flushInterval: 5000,
	});
	registerOTel({
		serviceName: "cloudy",
		traceExporter: exporter,
	});
}
