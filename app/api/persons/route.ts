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
      .from("person")
      .select(
        expand
          ? `*,
            person_employed_by(role_title, confidence, needs_review, organization(*)),
            person_founded_organization(role_title, confidence, needs_review, organization(*)),
            organization_has_ceo(role_title, confidence, needs_review, organization(*)),
            person_presented_at_session(session(*)),
            person_appeared_in_video(matched_name_variant, match_method, youtube_video(*))`
          : "*",
      )
      .order("full_name", { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
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
