import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabase } from "@/lib/supabase/server";

async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}
