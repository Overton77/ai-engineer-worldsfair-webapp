import { NextResponse } from "next/server";

import { FTS_OPTIONS } from "@/lib/api/apply-text-search";
import { parseListParams } from "@/lib/api/list-params";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { limit, offset, expand } = parseListParams(searchParams);
    const q = searchParams.get("q")?.trim();
    const supabase = createServiceClient();

    let query = supabase
      .from("youtube_video")
      .select(
        expand
          ? `*,
            youtube_channel(*),
            session_recorded_as_video(match_similarity, session(*)),
            person_appeared_in_video(matched_name_variant, match_method, person(*))`
          : "*",
      )
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.textSearch("fts", q, FTS_OPTIONS);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 },
      );
    }
    return NextResponse.json({ data, meta: { limit, offset } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
