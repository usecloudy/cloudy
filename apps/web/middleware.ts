import { NextRequest, NextResponse } from "next/server";

const allowedOrigins = ["https://app.usecloudy.com", "https://www.usecloudy.com", "https://usecloudy.com"];

if (process.env.NODE_ENV === "development") {
	allowedOrigins.push("http://localhost:3000");
	allowedOrigins.push("http://localhost:3001");
}

const corsOptions = {
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, x-vercel-protection-bypass, baggage, sentry-trace",
	"Access-Control-Allow-Credentials": "true",
};

export const middleware = (request: NextRequest) => {
	const origin = request.headers.get("origin");
	const isAllowedOrigin = origin && allowedOrigins.includes(origin);

	// Handle preflight requests
	if (request.method === "OPTIONS") {
		const preflightHeaders = {
			...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
			...corsOptions,
		};
		return NextResponse.json({}, { headers: preflightHeaders });
	}

	// TODO: Revisit this
	// const appUrl = process.env.NEXT_PUBLIC_APP_URL;
	// if (request.nextUrl.pathname.startsWith("/app")) {
	// 	return NextResponse.rewrite(new URL(appUrl + request.nextUrl.pathname + request.nextUrl.search, request.url));
	// }

	// if (request.nextUrl.pathname.startsWith("/site.webmanifest")) {
	// 	return NextResponse.rewrite(new URL(appUrl + "/site.webmanifest", request.url));
	// }

	// Handle simple requests
	const response = NextResponse.next();

	if (isAllowedOrigin) {
		response.headers.set("Access-Control-Allow-Origin", origin);
	}

	Object.entries(corsOptions).forEach(([key, value]) => {
		response.headers.set(key, value);
	});

	return response;
};

export const config = {
	matcher: "/:path*",
};
