import { NextResponse } from "next/server";

import { parseListParams } from "@/lib/api/list-params";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { limit, offset, expand } = parseListParams(searchParams);
    const q = searchParams.get("q")?.trim();
    const supabase = createServiceClient();

    let query = supabase
      .from("session")
      .select(
        expand
          ? `*,
            person_presented_at_session(person(*)),
            session_recorded_as_video(match_similarity, youtube_video(*))`
          : "*",
      )
      .order("title", { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,extended_description.ilike.%${q}%`,
      );
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
