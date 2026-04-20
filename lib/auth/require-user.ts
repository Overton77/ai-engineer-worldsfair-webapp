import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * The single source of "who is the request from?" used by Server
 * Components, Server Actions, and Route Handlers. Cached per render so
 * a layout + page + nested component making the call all share one DB
 * round trip.
 */
export const getOptionalUser = cache(async () => {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
});

/**
 * Pulls the current pathname from the proxy-set `x-pathname` header so
 * we can deep-link the post-login redirect back to where the user
 * tried to go. Falls back to `/`.
 */
async function currentPath(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-pathname") ?? "/";
  } catch {
    return "/";
  }
}

/**
 * Require an authed user; redirect to /login?next=… otherwise.
 *
 * Always call this in Server Actions and protected page components —
 * RLS is the database invariant; this is the application invariant.
 */
export async function requireUser() {
  const user = await getOptionalUser();
  if (!user) {
    const next = await currentPath();
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}

/**
 * Server-side ownership assertion. Throws (rather than returning a
 * boolean) so callers can't accidentally proceed past a failed check.
 *
 * Pair with RLS policies of the form
 *   `using ((select auth.uid()) = user_id)` — RLS makes the empty-update
 * silent at the DB; this throw turns it into a 4xx-equivalent.
 */
export function assertOwner(actorId: string, rowOwnerId: string): void {
  if (actorId !== rowOwnerId) {
    throw new Error("forbidden");
  }
}
