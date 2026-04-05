"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabase } from "@/lib/supabase/server";

function authLandingRedirect(opts: {
  error?: string;
  message?: string;
  redirect?: string;
}) {
  const p = new URLSearchParams();
  if (opts.error) p.set("error", opts.error);
  if (opts.message) p.set("message", opts.message);
  if (opts.redirect) p.set("redirect", opts.redirect);
  const q = p.toString();
  redirect(q ? `/?${q}` : "/");
}

function safeRedirectPath(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  return "/directory";
}

export async function signInWithPassword(formData: FormData) {
  const supabase = await createServerSupabase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(formData.get("redirect"));

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    authLandingRedirect({
      error: error.message,
      redirect: redirectTo,
    });
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUpWithPassword(formData: FormData) {
  const supabase = await createServerSupabase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(formData.get("redirect"));

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    authLandingRedirect({
      error: error.message,
      redirect: redirectTo,
    });
  }

  revalidatePath("/", "layout");
  authLandingRedirect({
    message:
      "Account created. If email confirmation is on in Supabase, check your inbox; otherwise sign in below.",
    redirect: redirectTo,
  });
}
