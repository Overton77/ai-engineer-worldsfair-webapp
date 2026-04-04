import { NextResponse } from "next/server";

import { FTS_OPTIONS } from "@/lib/api/apply-text-search";
import { createServiceClient } from "@/lib/supabase/admin";

const DEFAULT_LIMIT = 12;

/**
 * Cross-entity full-text search (people, organizations, YouTube videos).
 * Sessions use the /api/sessions?q= endpoint (ILIKE) — not included here.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({
        query: "",
        persons: [],
        organizations: [],
        youtube_videos: [],
      });
    }

    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      50,
    );

    const supabase = createServiceClient();

    const personSel = `person_id, full_name, first_name, last_name, role_title, tag_line, sessionize_profile_picture_url`;
    const orgSel = `organization_id, name, organization_type, website_domain, primary_ai_focus`;
    const videoSel = `video_id, title, thumbnail_url, published_at, url, channel_id`;

    const [pr, or, vi] = await Promise.all([
      supabase
        .from("person")
        .select(personSel)
        .textSearch("fts", q, FTS_OPTIONS)
        .order("full_name", { ascending: true, nullsFirst: false })
        .limit(limit),
      supabase
        .from("organization")
        .select(orgSel)
        .textSearch("fts", q, FTS_OPTIONS)
        .order("name", { ascending: true, nullsFirst: false })
        .limit(limit),
      supabase
        .from("youtube_video")
        .select(`${videoSel}, youtube_channel(channel_title)`)
        .textSearch("fts", q, FTS_OPTIONS)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit),
    ]);

    const errors = [pr.error, or.error, vi.error].filter(Boolean);
    if (errors.length) {
      const first = errors[0];
      return NextResponse.json(
        { error: first?.message ?? "Search failed", details: errors },
        { status: 500 },
      );
    }

    return NextResponse.json({
      query: q,
      persons: pr.data ?? [],
      organizations: or.data ?? [],
      youtube_videos: vi.data ?? [],
      meta: { limit },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
