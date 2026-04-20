import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Reads `profiles.is_admin` for a user id. Cached per request render.
 * Pairs with the admin-only RLS policies on course / course_module /
 * challenge / course_module_review (migration 20260421121000).
 */
export const isAdmin = cache(async (userId: string): Promise<boolean> => {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.is_admin);
});

/**
 * Throws if the user is not an admin. Use in Server Actions that flip
 * publish-flow status columns or write reviews. RLS is the DB-level
 * backstop; this is the API-surface guard so callers see a clear
 * error instead of a silent empty update.
 */
export async function assertAdmin(userId: string): Promise<void> {
  const ok = await isAdmin(userId);
  if (!ok) throw new Error("forbidden: admin only");
}
