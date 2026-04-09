import { NextResponse } from "next/server";

import { FTS_OPTIONS } from "@/lib/api/apply-text-search";
import { parseListParams } from "@/lib/api/list-params";
import { createServiceClient } from "@/lib/supabase/admin";

const ORGANIZATION_LIST = `
  organization_id,
  name,
  organization_type,
  website_domain,
  primary_ai_focus,
  overview
`;

const ORGANIZATION_EXPAND = `*,
  person_employed_by(role_title, confidence, needs_review, person(*)),
  person_founded_organization(role_title, confidence, needs_review, person(*)),
  organization_has_ceo(role_title, confidence, needs_review, person(*))`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { limit, offset, expand } = parseListParams(searchParams, {
      maxLimit: 5000,
    });
    const q = searchParams.get("q")?.trim();
    const supabase = createServiceClient();

    let query = supabase
      .from("organization")
      .select(expand ? ORGANIZATION_EXPAND : ORGANIZATION_LIST)
      .order("name", { ascending: true, nullsFirst: false })
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
