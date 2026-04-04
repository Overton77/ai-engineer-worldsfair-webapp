import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Server-only client with the service role key. Use only in Route Handlers,
 * Server Actions, or other trusted server code — never import from client components.
 */
export function createServiceClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
