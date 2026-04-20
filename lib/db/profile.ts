import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/require-user";
import type { Database } from "@/types/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type PublicProfile =
  Database["public"]["Views"]["public_profile"]["Row"];

/**
 * Fetches the *caller's own* profile. Pairs with the trigger that
 * auto-creates the row on signup (Q3) — so this is one round trip and
 * the row is always there.
 */
export async function getOwnProfile(): Promise<ProfileRow> {
  const user = await requireUser();
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(`getOwnProfile failed: ${error.message}`);
  if (!data) {
    throw new Error(
      `Profile row missing for ${user.id}; handle_new_user trigger did not fire?`,
    );
  }
  return data;
}

/**
 * Fetches an arbitrary user's profile by id (caller must have RLS
 * permission). Used by admin views and shared layout queries.
 */
export async function getProfileById(
  userId: string,
): Promise<ProfileRow | null> {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`getProfileById failed: ${error.message}`);
  return data ?? null;
}

/**
 * Public-facing profile lookup. Reads through the `public_profile`
 * view, which already filters on `is_public = true` and exposes only
 * the whitelisted columns from Q11.
 */
export async function getPublicProfileByUsername(
  username: string,
): Promise<PublicProfile | null> {
  const sb = await createServerSupabase();
  const { data, error } = await sb
    .from("public_profile")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error)
    throw new Error(`getPublicProfileByUsername failed: ${error.message}`);
  return data ?? null;
}

export type ShellProfile = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

/**
 * Tiny projection for the top-bar avatar / menu. Returns email +
 * display_name + avatar_url so the UI can render initials when the
 * avatar is missing.
 */
export async function getShellProfile(userId: string): Promise<ShellProfile> {
  const sb = await createServerSupabase();
  const { data } = await sb
    .from("profiles")
    .select("email, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return {
    email: data?.email ?? "",
    displayName: data?.display_name ?? null,
    avatarUrl: data?.avatar_url ?? null,
  };
}
