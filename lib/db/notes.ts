/**
 * Notes DAL — CRUD + FTS list + per-entity list.
 *
 * Source of truth:
 *  - `notes.content_json` is the editor-state of record (TipTap doc)
 *  - `notes.content_text` is derived server-side from content_json
 *    via `lib/notes/derive-text.ts` and is the only thing fed into
 *    `notes.fts`. Don't write content_text from the client.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase/server";
import type { EntityKind } from "@/lib/schema/entity-kind";
import type { Database, Json } from "@/types/database.types";

import { deriveContentText } from "@/lib/notes/derive-text";
import {
  asNoteSummary,
  emptyDoc,
  type NoteDoc,
  type NotePin,
  type NoteSummary,
} from "@/lib/notes/types";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? (await createServerSupabase());
}

export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];

export async function getNoteById(
  id: string,
  userId: string,
  client?: Client,
): Promise<NoteRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn(`notes.getNoteById: ${error.message}`);
    return null;
  }
  return data;
}

export type ListNotesArgs = {
  userId: string;
  /** Free-text FTS query (websearch_to_tsquery). */
  q?: string;
  /** Filter to notes pinned to entities of this kind. */
  pinKind?: EntityKind;
  /** When true, return only freeform (entity_type IS NULL). */
  freeformOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type ListNotesResult = {
  rows: NoteSummary[];
  total: number;
};

export async function listNotesForUser(
  args: ListNotesArgs,
  client?: Client,
): Promise<ListNotesResult> {
  const sb = await getClient(client);
  const limit = Math.min(args.limit ?? 30, 100);
  const offset = Math.max(args.offset ?? 0, 0);
  let q = sb
    .from("notes")
    .select("*", { count: "exact" })
    .eq("user_id", args.userId);

  if (args.pinKind) q = q.eq("entity_type", args.pinKind);
  if (args.freeformOnly) q = q.is("entity_type", null);
  if (args.q && args.q.trim()) {
    q = q.textSearch("fts", args.q.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  q = q.order("updated_at", { ascending: false });
  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    console.warn(`notes.listNotesForUser: ${error.message}`);
    return { rows: [], total: 0 };
  }
  return {
    rows: (data ?? []).map(asNoteSummary),
    total: count ?? 0,
  };
}

export async function listNotesForEntity(
  args: { userId: string; kind: EntityKind; id: string; limit?: number },
  client?: Client,
): Promise<NoteSummary[]> {
  const sb = await getClient(client);
  const limit = Math.min(args.limit ?? 20, 100);
  const { data, error } = await sb
    .from("notes")
    .select("*")
    .eq("user_id", args.userId)
    .eq("entity_type", args.kind)
    .eq("entity_id", args.id)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn(`notes.listNotesForEntity: ${error.message}`);
    return [];
  }
  return (data ?? []).map(asNoteSummary);
}

export async function listRecentlyEditedNotes(
  userId: string,
  limit = 5,
  client?: Client,
): Promise<NoteSummary[]> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(Math.min(limit, 20));
  if (error) {
    console.warn(`notes.listRecentlyEditedNotes: ${error.message}`);
    return [];
  }
  return (data ?? []).map(asNoteSummary);
}

export async function countNotesForEntity(
  args: { userId: string; kind: EntityKind; id: string },
  client?: Client,
): Promise<number> {
  const sb = await getClient(client);
  const { count, error } = await sb
    .from("notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", args.userId)
    .eq("entity_type", args.kind)
    .eq("entity_id", args.id);
  if (error) {
    console.warn(`notes.countNotesForEntity: ${error.message}`);
    return 0;
  }
  return count ?? 0;
}

export type UpsertNoteInput = {
  /** When omitted, INSERTs a new note. */
  id?: string;
  user_id: string;
  /** Optional — server falls back to deriveDefaultTitle(doc). */
  title?: string;
  contentJson: NoteDoc;
  pin?: NotePin | null;
};

/**
 * Insert or update a note. Returns the persisted row. content_text is
 * always re-derived here — clients cannot poison the FTS index.
 */
export async function upsertNote(
  input: UpsertNoteInput,
  client?: Client,
): Promise<NoteRow | null> {
  const sb = await getClient(client);
  const content_text = deriveContentText(input.contentJson);
  const title = input.title?.trim() || "Untitled";

  if (input.id) {
    const { data, error } = await sb
      .from("notes")
      .update({
        title,
        content_json: input.contentJson as unknown as Json,
        content_text,
        entity_type: input.pin?.kind ?? null,
        entity_id: input.pin?.id ?? null,
        entity_title: input.pin?.title ?? null,
      })
      .eq("id", input.id)
      .eq("user_id", input.user_id)
      .select("*")
      .single();
    if (error) {
      console.warn(`notes.upsertNote(update): ${error.message}`);
      return null;
    }
    return data;
  }

  const { data, error } = await sb
    .from("notes")
    .insert({
      user_id: input.user_id,
      title,
      content_json: input.contentJson as unknown as Json,
      content_text,
      entity_type: input.pin?.kind ?? null,
      entity_id: input.pin?.id ?? null,
      entity_title: input.pin?.title ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn(`notes.upsertNote(insert): ${error.message}`);
    return null;
  }
  return data;
}

export async function deleteNote(
  id: string,
  userId: string,
  client?: Client,
): Promise<boolean> {
  const sb = await getClient(client);
  const { error } = await sb
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    console.warn(`notes.deleteNote: ${error.message}`);
    return false;
  }
  return true;
}

/**
 * Convenience for "create a brand-new empty note pinned to <ref>".
 * Used by the N1 drawer's `?note=new&pinTo=…` path so the editor
 * always has a real id once the user starts typing.
 */
export async function createEmptyNote(
  args: { userId: string; pin?: NotePin | null; title?: string },
  client?: Client,
): Promise<NoteRow | null> {
  return upsertNote(
    {
      user_id: args.userId,
      title: args.title || "Untitled",
      contentJson: emptyDoc(),
      pin: args.pin ?? null,
    },
    client,
  );
}

export type { NoteSummary } from "@/lib/notes/types";
