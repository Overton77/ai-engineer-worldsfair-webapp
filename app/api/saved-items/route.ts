import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureProfile } from "@/lib/profile";
import { createServerSupabase } from "@/lib/supabase/server";
import { entityTypeSchema, savedItemSchema } from "@/lib/user-content";

const savedItemDeleteSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().trim().min(1).max(255),
});

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfile(supabase, user);

    const { data, error } = await supabase
      .from("saved_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("saved-items.get", error);
      return NextResponse.json({ error: "Failed to load saved items" }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("saved-items.get", error);
    return NextResponse.json({ error: "Failed to load saved items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureProfile(supabase, user);

    const rawBody = await request.json().catch(() => null);
    const parsed = savedItemSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid saved-item payload" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("saved_items")
      .upsert(
        {
          user_id: user.id,
          entity_type: parsed.data.entityType,
          entity_id: parsed.data.entityId,
          entity_title: parsed.data.entityTitle,
          entity_subtitle: parsed.data.entitySubtitle ?? null,
        },
        { onConflict: "user_id,entity_type,entity_id" },
      )
      .select("*")
      .single();

    if (error) {
      console.error("saved-items.post", error);
      return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("saved-items.post", error);
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = savedItemDeleteSchema.safeParse({
      entityType: searchParams.get("entityType"),
      entityId: searchParams.get("entityId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid delete request" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("entity_type", parsed.data.entityType)
      .eq("entity_id", parsed.data.entityId);

    if (error) {
      console.error("saved-items.delete", error);
      return NextResponse.json({ error: "Failed to remove saved item" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("saved-items.delete", error);
    return NextResponse.json({ error: "Failed to remove saved item" }, { status: 500 });
  }
}
