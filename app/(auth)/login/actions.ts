"use server";

import { z } from "zod";

import { getSiteUrl } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

const RequestMagicLinkSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  next: z
    .string()
    .optional()
    .transform((v) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/")),
});

export type LoginActionState =
  | { status: "idle" }
  | { status: "ok"; email: string }
  | { status: "error"; message: string };

/**
 * Server Action that requests a Supabase magic link. Returns a state
 * object the client form renders into success / error UI via
 * `useActionState`. We never reveal whether the email exists — Supabase
 * sends a sign-up + sign-in email transparently (depending on auth
 * settings) so the response is always the same shape on the happy path.
 */
export async function requestMagicLinkAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = RequestMagicLinkSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
    };
  }

  const { email, next } = parsed.data;
  const sb = await createServerSupabase();

  const emailRedirectTo = new URL("/auth/callback", getSiteUrl());
  emailRedirectTo.searchParams.set("next", next);

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: emailRedirectTo.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return { status: "ok", email };
}
