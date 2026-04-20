import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Refreshes Supabase auth cookies on every request. Returns
 * `{ response, user, profile }` so the proxy can decide whether to
 * redirect (auth gates, onboarding gating) before sending the
 * cookie-bearing response back to the browser.
 *
 * The dance with cookies is unavoidable: the SSR client sets cookies
 * on the *outgoing* response object, so we have to construct it
 * eagerly and clone it whenever Supabase rotates a cookie.
 */
export async function refreshSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  let response = NextResponse.next({ request });
  if (!url || !key) {
    return { response, user: null, onboardingStatus: null };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let onboardingStatus: string | null = null;
  if (user) {
    // Onboarding gate optimistic check. RLS makes this a one-row
    // self-read; tolerable on every navigation.
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_status")
      .eq("id", user.id)
      .maybeSingle();
    onboardingStatus = data?.onboarding_status ?? null;
  }

  return { response, user, onboardingStatus };
}

export function copyCookies(
  from: NextResponse,
  to: NextResponse,
): NextResponse {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
  return to;
}
