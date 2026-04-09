import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";

function fallbackDisplayName(user: Pick<User, "email" | "user_metadata">): string | null {
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";

  if (metadataName) return metadataName;
  return user.email?.split("@")[0] ?? null;
}

export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  user: Pick<User, "id" | "email" | "user_metadata">,
): Promise<Tables<"profiles">> {
  const defaults = {
    id: user.id,
    email: user.email ?? null,
    display_name: fallbackDisplayName(user),
  };

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert(defaults)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
