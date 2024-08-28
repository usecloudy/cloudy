import { createClient, PostgrestSingleResponse } from "@supabase/supabase-js"
import { Database } from "app/db/database.types"

export const getSupabase = ({ authHeader, mode }: { authHeader?: string | null; mode: "service" | "client" }) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  if (mode === "client") {
    if (!authHeader) {
      throw new Error("Missing authHeader for client mode")
    }

    return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

export const handleSupabaseError = <T>(response: PostgrestSingleResponse<T>) => {
  if (response.error) {
    console.error(
      "Supabase error:",
      response.error.message,
      "Details:",
      response.error.details,
      "Hint:",
      response.error.hint
    )
    throw new Error(`Database operation failed: ${response.error.message}`)
  }
  return response.data
}
