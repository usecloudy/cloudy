import { Database } from "@repo/db";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { NextRequest } from "next/server";

export const getSupabase = async ({
	authHeader,
	request,
	mode,
	bypassAuth,
}: {
	/** @deprecated pass request instead */
	authHeader?: string | null;
	request?: NextRequest | null;
	mode: "service" | "client";
	bypassAuth?: boolean;
}) => {
	const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SERVICE_WEBHOOK_SECRET } = process.env;

	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !SERVICE_WEBHOOK_SECRET) {
		throw new Error("Missing Supabase environment variables");
	}

	if (mode === "client") {
		const clientAuthHeader = authHeader ?? request?.headers?.get("Authorization");

		if (!clientAuthHeader) {
			throw new Error("Missing authHeader for client mode");
		}

		return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: clientAuthHeader } },
		});
	}

	if (bypassAuth) {
		return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
	}

	const supabaseSignature = request?.headers?.get("x-supabase-signature");

	if (!supabaseSignature) {
		throw new Error("Missing supabaseSignature for service mode");
	}

	// Clone the request to get a fresh body stream
	const clonedRequest = request?.clone();
	const body = await clonedRequest?.text();

	if (!body) {
		throw new Error("Missing body for service mode");
	}

	const decodedSignature = Buffer.from(supabaseSignature, "base64");
	const calculatedSignature = crypto.createHmac("sha256", SERVICE_WEBHOOK_SECRET).update(body).digest();

	const hmacMatch = crypto.timingSafeEqual(decodedSignature, calculatedSignature);

	if (!hmacMatch) {
		throw new Error("Invalid signature");
	}

	return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};

// select
//   vault.update_secret(
//     '9f5f7a4c-f5f0-469f-a236-81f07e750a0f',
//     'dev-service-webhook-secret',
//     'WEBHOOK_SECRET',
//     'This is the webhook secret used to communicate with the Nextjs App'
//   );

export const withProtectedRoute = (
	handler: (payload: { request: NextRequest; context: any; supabase: SupabaseClient<Database> }) => Promise<Response>,
	mode: "service" | "client",
) => {
	return async (request: NextRequest, context: any) => {
		try {
			const supabase = await getSupabase({ request, mode });
			return handler({ request, context, supabase });
		} catch (error) {
			console.error("Protected route error:", error);
			return new Response("Unauthorized", { status: 401 });
		}
	};
};
