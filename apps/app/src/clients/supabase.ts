import { createClient } from "@supabase/supabase-js";

import { Database } from "src/database.types";

export const supabase = createClient<Database>(process.env.REACT_APP_SUPABASE_URL!, process.env.REACT_APP_SUPABASE_ANON_KEY!, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
	},
});
