import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = ["http://localhost:3000"];

const corsOptions = {
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, x-vercel-protection-bypass, baggage, sentry-trace",
	"Access-Control-Allow-Credentials": "true",
};

export function middleware(request: NextRequest) {
	// Check the origin from the request
	const origin = request.headers.get("origin");
	console.log("origin", origin);
	// const isAllowedOrigin = allowedOrigins.includes(origin);
	const isAllowedOrigin = true;

	// Handle preflighted requests
	const isPreflight = request.method === "OPTIONS";

	if (isPreflight) {
		const preflightHeaders = {
			...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin || "*" }),
			...corsOptions,
		};
		return NextResponse.json({}, { headers: preflightHeaders });
	}

	// Handle simple requests
	const response = NextResponse.next();

	if (isAllowedOrigin) {
		response.headers.set("Access-Control-Allow-Origin", "*");
	}

	Object.entries(corsOptions).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
}

export const config = {
	matcher: "/:path*",
};
