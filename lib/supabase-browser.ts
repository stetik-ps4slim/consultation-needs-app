import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client — uses the public anon key.
 * Only use this in "use client" components.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}
