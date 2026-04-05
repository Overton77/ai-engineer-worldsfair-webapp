import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export function createBrowserSupabase() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or anon/publishable key",
    );
  }
  return createBrowserClient<Database>(url, key);
}
