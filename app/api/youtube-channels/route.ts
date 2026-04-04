import { NextResponse } from "next/server";

import { parseListParams } from "@/lib/api/list-params";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { limit, offset, expand } = parseListParams(searchParams);
    const supabase = createServiceClient();

    const query = supabase
      .from("youtube_channel")
      .select(expand ? "*, youtube_video(*)" : "*")
      .order("channel_title", { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

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
