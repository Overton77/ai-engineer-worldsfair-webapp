import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/admin";

const VIDEO_EXPAND = `*,
  youtube_channel(*),
  session_recorded_as_video(match_similarity, session(*)),
  person_appeared_in_video(matched_name_variant, match_method, person(*))`;

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const expand =
    searchParams.get("expand") === "1" ||
    searchParams.get("expand") === "true";

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("youtube_video")
      .select(expand ? VIDEO_EXPAND : "*")
      .eq("video_id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
