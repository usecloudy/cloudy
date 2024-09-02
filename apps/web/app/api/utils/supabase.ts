import { Database } from "@repo/db";
import { createClient } from "@supabase/supabase-js";

export const getSupabase = ({ authHeader, mode }: { authHeader?: string | null; mode: "service" | "client" }) => {
	const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET } = process.env;

	if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error("Missing Supabase environment variables");
	}

	if (mode === "client") {
		if (!authHeader) {
			throw new Error("Missing authHeader for client mode");
		}

		return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: authHeader } },
		});
	}

	if (!authHeader) {
		throw new Error("Missing authHeader for service mode");
	}

	// TODO: This is insecure af, we'll need to do actual secret signing.
	const secret = authHeader.split(" ")[1];

	if (secret !== SUPABASE_SECRET) {
		throw new Error("Invalid supabase secret");
	}

	return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
};
