import { NextResponse, type NextRequest } from "next/server";

import { copyCookies, refreshSession } from "@/lib/supabase/middleware";

/**
 * Next 16 Proxy (formerly Middleware). Two jobs:
 *
 * 1. Refresh the Supabase auth cookie on every request via the SSR
 *    client so Server Components see the latest session.
 * 2. Optimistic auth + onboarding gating — the cheapest possible
 *    redirects that prevent rendering pages the user shouldn't see.
 *    The DB-side guarantees still come from RLS + `requireUser()`
 *    in Server Actions; this is just for UX.
 */

const PUBLIC_PATHS = new Set<string>(["/welcome", "/login", "/logout"]);
const PUBLIC_PREFIXES = [
  "/auth/",
  // Vercel Queues authenticates callbacks separately; these requests do not
  // carry Supabase browser cookies during local priming or production delivery.
  "/api/queues/",
  "/api/admin/recommendations/drain",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

const ONBOARDING_PREFIX = "/onboarding";
const COMPLETED_STATUSES = new Set(["complete", "skipped"]);

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user, onboardingStatus } = await refreshSession(request);

  // Forward the pathname so server components can deep-link redirects
  // back to where the user tried to go (e.g. `requireUser()`).
  response.headers.set("x-pathname", pathname + search);

  const isAuthenticated = Boolean(user);
  const onboardingComplete =
    onboardingStatus !== null && COMPLETED_STATUSES.has(onboardingStatus);

  // ── Authed user on a public auth surface → bounce home ──────────────
  if (isAuthenticated && (pathname === "/login" || pathname === "/welcome")) {
    const dest = request.nextUrl.clone();
    dest.pathname = onboardingComplete ? "/" : "/onboarding/welcome";
    dest.search = "";
    const redirect = NextResponse.redirect(dest);
    return copyCookies(response, redirect);
  }

  // ── Unauthed user on a protected surface → /login ───────────────────
  if (!isAuthenticated && !isPublic(pathname) && pathname !== "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/login";
    dest.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(dest);
    return copyCookies(response, redirect);
  }

  // ── Unauthed user at "/" → marketing ─────────────────────────────────
  if (!isAuthenticated && pathname === "/") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/welcome";
    dest.search = "";
    const redirect = NextResponse.redirect(dest);
    return copyCookies(response, redirect);
  }

  // ── Authed user with unfinished onboarding → wizard ─────────────────
  if (
    isAuthenticated &&
    !onboardingComplete &&
    !pathname.startsWith(ONBOARDING_PREFIX) &&
    pathname !== "/logout"
  ) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/onboarding/welcome";
    dest.search = "";
    const redirect = NextResponse.redirect(dest);
    return copyCookies(response, redirect);
  }

  // ── Authed user who finished onboarding hitting wizard → home ───────
  if (
    isAuthenticated &&
    onboardingComplete &&
    pathname.startsWith(ONBOARDING_PREFIX)
  ) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/";
    dest.search = "";
    const redirect = NextResponse.redirect(dest);
    return copyCookies(response, redirect);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and static asset requests.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?)$).*)",
  ],
};
