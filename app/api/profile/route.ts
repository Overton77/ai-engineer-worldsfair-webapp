import { NextResponse } from "next/server";

import { ensureProfile } from "@/lib/profile";
import { profileUpdateSchema } from "@/lib/user-content";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ensureProfile(supabase, user);
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("profile.get", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfile(supabase, user);

    const rawBody = await request.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile payload" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        display_name: parsed.data.displayName ?? null,
        bio: parsed.data.bio ?? null,
        avatar_url: parsed.data.avatarUrl ?? null,
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("profile.patch", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("profile.patch", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
