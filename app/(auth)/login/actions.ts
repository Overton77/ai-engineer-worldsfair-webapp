"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getSiteUrl } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

const NextSchema = z
  .string()
  .optional()
  .transform((v) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/"));

const EmailSchema = z.string().email().trim().toLowerCase();

const PasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.");

const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  next: NextSchema,
});

const SignUpSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(8, "Use at least 8 characters for new accounts."),
  next: NextSchema,
});

const MagicLinkSchema = z.object({
  email: EmailSchema,
  next: NextSchema,
});

export type LoginActionState =
  | { status: "idle" }
  | { status: "magic_link_sent"; email: string }
  | { status: "check_email"; email: string }
  | { status: "error"; message: string };

const INVALID_CREDENTIALS_HINTS = ["invalid login", "invalid credentials"];

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (INVALID_CREDENTIALS_HINTS.some((h) => lower.includes(h))) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("user already registered")) {
    return "An account with that email already exists. Try signing in.";
  }
  return message;
}

/**
 * Email + password sign in. On success, throws a redirect (caught by
 * Next) so the proxy can route the user to onboarding or home.
 */
export async function signInWithPasswordAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid form input.",
    };
  }

  const { email, password, next } = parsed.data;
  const sb = await createServerSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  redirect(next);
}

/**
 * Email + password sign up. Locally `enable_confirmations = false` so
 * the response carries a session and we redirect immediately. In a
 * Supabase project with email confirmations on, no session is returned
 * and we render a "check your email" panel instead.
 */
export async function signUpWithPasswordAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid form input.",
    };
  }

  const { email, password, next } = parsed.data;
  const sb = await createServerSupabase();

  const emailRedirectTo = new URL("/auth/callback", getSiteUrl());
  emailRedirectTo.searchParams.set("next", next);

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: emailRedirectTo.toString() },
  });

  if (error) {
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  if (data.session) {
    redirect(next);
  }

  return { status: "check_email", email };
}

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
  const parsed = MagicLinkSchema.safeParse({
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
    return { status: "error", message: friendlyAuthError(error.message) };
  }

  return { status: "magic_link_sent", email };
}
