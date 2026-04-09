import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureProfile } from "@/lib/profile";
import { createServerSupabase } from "@/lib/supabase/server";
import { entityTypeSchema, noteCreateSchema, noteUpdateSchema } from "@/lib/user-content";
import type { Json } from "@/types/database.types";

const notesFilterSchema = z
  .object({
    id: z.string().uuid().optional(),
    entityType: entityTypeSchema.nullable().optional(),
    entityId: z.string().trim().min(1).max(255).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const hasType = !!value.entityType;
    const hasId = !!value.entityId;

    if (hasType !== hasId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["entityId"],
        message: "Entity type and entity id must be provided together.",
      });
    }
  });

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const parsed = notesFilterSchema.safeParse({
      id: searchParams.get("id") ?? undefined,
      entityType: searchParams.get("entityType"),
      entityId: searchParams.get("entityId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid notes filter" },
        { status: 400 },
      );
    }

    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (parsed.data.id) {
      query = query.eq("id", parsed.data.id);
    }
    if (parsed.data.entityType && parsed.data.entityId) {
      query = query
        .eq("entity_type", parsed.data.entityType)
        .eq("entity_id", parsed.data.entityId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("notes.get", error);
      return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("notes.get", error);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
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
    const parsed = noteCreateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid note payload" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        content_json: parsed.data.contentJson as Json,
        content_text: parsed.data.contentText,
        entity_type: parsed.data.entityType ?? null,
        entity_id: parsed.data.entityId ?? null,
        entity_title: parsed.data.entityTitle ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("notes.post", error);
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("notes.post", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const parsed = noteUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid note payload" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("notes")
      .update({
        title: parsed.data.title,
        content_json: parsed.data.contentJson as Json,
        content_text: parsed.data.contentText,
        entity_type: parsed.data.entityType ?? null,
        entity_id: parsed.data.entityId ?? null,
        entity_title: parsed.data.entityTitle ?? null,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("notes.patch", error);
      return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("notes.patch", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Note id is required" }, { status: 400 });
    }

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id);

    if (error) {
      console.error("notes.delete", error);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("notes.delete", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
