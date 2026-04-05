import { NextResponse } from "next/server";

import { FTS_OPTIONS } from "@/lib/api/apply-text-search";
import { parseListParams } from "@/lib/api/list-params";
import { parseYoutubeVideoFiltersFromSearchParams } from "@/lib/api/youtube-video-filters";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { limit, offset, expand } = parseListParams(searchParams, {
      maxLimit: 5000,
    });
    const q = searchParams.get("q")?.trim();
    const vf = parseYoutubeVideoFiltersFromSearchParams(searchParams);
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
      );

    if (vf.min_views != null) {
      query = query.gte("view_count", vf.min_views);
    }
    if (vf.max_views != null) {
      query = query.lte("view_count", vf.max_views);
    }
    if (vf.min_likes != null) {
      query = query.gte("like_count", vf.min_likes);
    }
    if (vf.max_likes != null) {
      query = query.lte("like_count", vf.max_likes);
    }
    if (vf.min_duration_sec != null) {
      query = query.gte("duration_seconds", vf.min_duration_sec);
    }
    if (vf.max_duration_sec != null) {
      query = query.lte("duration_seconds", vf.max_duration_sec);
    }

    if (q) {
      query = query.textSearch("fts", q, FTS_OPTIONS);
    }

    query = query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 },
      );
    }
    return NextResponse.json({
      data,
      meta: { limit, offset, filters: vf },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
