import { createServerSupabase } from "@/lib/supabase/server";

export type CurrentUserStats = {
  xpTotal: number;
  streakDays: number;
};

const ZERO: CurrentUserStats = { xpTotal: 0, streakDays: 0 };

/**
 * Reads the per-caller XP + streak from the `current_user_stats` view
 * (security_invoker — RLS scopes to the caller). Returns zeros if the
 * row is missing rather than throwing — the shell rail should never
 * crash because a brand-new user has no rows yet.
 */
export async function getCurrentUserStats(
  userId: string,
): Promise<CurrentUserStats> {
  const sb = await createServerSupabase();
  const { data } = await sb
    .from("current_user_stats")
    .select("xp_total, streak_days")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return ZERO;
  return {
    xpTotal: data.xp_total ?? 0,
    streakDays: data.streak_days ?? 0,
  };
}
