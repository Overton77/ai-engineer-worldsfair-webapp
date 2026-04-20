"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { createServerSupabase } from "@/lib/supabase/server";

import {
  ProfileUpdateSchema,
  SetOnboardingStatusSchema,
  type ProfileUpdateInput,
  type SetOnboardingStatusInput,
} from "./profile-schema";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Partial-update the caller's own profiles row. Allow-listed fields
 * only (see ProfileUpdateSchema). RLS already restricts the row to the
 * caller; `assertOwner` is implicit here because we constrain `.eq("id", user.id)`.
 *
 * Tag arrays are validated against the canonical taxonomy, so free-text
 * writes are rejected at the action boundary even though the DB column
 * is `text[]`.
 */
export async function updateProfileFields(
  input: ProfileUpdateInput,
): Promise<ActionResult<{ updated: true }>> {
  const parsed = ProfileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      ok: false,
      error: "Invalid profile fields.",
      fieldErrors: tree.fieldErrors as Record<string, string[]>,
    };
  }

  const user = await requireUser();
  const sb = await createServerSupabase();
  const patch = { ...parsed.data, updated_at: new Date().toISOString() };
  const { error } = await sb.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, data: { updated: true } };
}

/**
 * Sets the wizard step pointer (Q3). Used by every onboarding step
 * after a successful save. Validated against the DB CHECK whitelist.
 */
export async function setOnboardingStatus(
  input: SetOnboardingStatusInput,
): Promise<ActionResult<{ status: string }>> {
  const parsed = SetOnboardingStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid onboarding status." };
  }

  const user = await requireUser();
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("profiles")
    .update({
      onboarding_status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, data: { status: parsed.data.status } };
}

/**
 * Avatar updates write only the URL — the actual file upload happens
 * client-side against Supabase Storage (U2.3) using the publishable
 * key + the avatars bucket's owner-write RLS.
 */
export async function updateAvatarUrl(
  avatarUrl: string | null,
): Promise<ActionResult<{ avatar_url: string | null }>> {
  const parsed = ProfileUpdateSchema.pick({ avatar_url: true }).safeParse({
    avatar_url: avatarUrl,
  });
  if (!parsed.success) return { ok: false, error: "Invalid avatar URL." };

  const user = await requireUser();
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("profiles")
    .update({
      avatar_url: parsed.data.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, data: { avatar_url: parsed.data.avatar_url ?? null } };
}
