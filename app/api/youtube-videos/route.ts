import { NextResponse } from "next/server";

import { FTS_OPTIONS } from "@/lib/api/apply-text-search";
import { parseListParams } from "@/lib/api/list-params";
import { createServiceClient } from "@/lib/supabase/admin";

const ALLOWED_SORT_COLUMNS = new Set(["published_at", "view_count", "title", "like_count", "duration_seconds"]);

const VIDEO_LIST = `
  video_id,
  title,
  thumbnail_url,
  published_at,
  url,
  duration,
  duration_seconds,
  description,
  view_count,
  like_count,
  channel_id,
  youtube_channel(channel_title)
`;

const VIDEO_EXPAND = `*,
  youtube_channel(*),
  session_recorded_as_video(match_similarity, session(*)),
  person_appeared_in_video(matched_name_variant, match_method, person(*))`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { limit, offset, expand } = parseListParams(searchParams, {
      maxLimit: 5000,
    });
    const q = searchParams.get("q")?.trim();
    const sortBy = searchParams.get("sort_by")?.trim() ?? "published_at";
    const sortDir = searchParams.get("sort_dir")?.trim() ?? "desc";
    const supabase = createServiceClient();

    let query = supabase
      .from("youtube_video")
      .select(expand ? VIDEO_EXPAND : VIDEO_LIST, { count: "exact" });

    if (q) {
      query = query.textSearch("fts", q, FTS_OPTIONS);
    }

    const column = ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : "published_at";
    const ascending = sortDir === "asc";

    query = query
      .order(column, { ascending, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 },
      );
    }
    return NextResponse.json({
      data,
      meta: {
        limit,
        offset,
        total: count ?? data?.length ?? 0,
        sort_by: column,
        sort_dir: sortDir,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
