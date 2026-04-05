import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

/**
 * Refreshes the auth session on each matched request. Protects `/dashboard`.
 */
export async function updateSession(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    const redirectResponse = NextResponse.redirect(home);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (
    pathname === "/" &&
    user &&
    !request.nextUrl.searchParams.has("error") &&
    !request.nextUrl.searchParams.has("message") &&
    !request.nextUrl.searchParams.has("redirect")
  ) {
    const dir = request.nextUrl.clone();
    dir.pathname = "/directory";
    dir.search = "";
    const redirectResponse = NextResponse.redirect(dir);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (pathname.startsWith("/dashboard") && !user) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(home);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
