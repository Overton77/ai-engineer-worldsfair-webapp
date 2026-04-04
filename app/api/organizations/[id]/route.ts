import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/admin";

const ORG_EXPAND = `*,
  person_employed_by(role_title, confidence, needs_review, person(*)),
  person_founded_organization(role_title, confidence, needs_review, person(*)),
  organization_has_ceo(role_title, confidence, needs_review, person(*))`;

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
      .from("organization")
      .select(expand ? ORG_EXPAND : "*")
      .eq("organization_id", id)
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
