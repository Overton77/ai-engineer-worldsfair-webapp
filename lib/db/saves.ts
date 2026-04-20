/**
 * Saved-items DAL — polymorphic bookmark per (user, entity_type,
 * entity_id). Denormalises `entity_title` / `entity_subtitle` so the
 * `/saved` index renders without joining back to entity tables.
 *
 * Reads use the SSR Supabase client (RLS scopes everything to the
 * calling user via `saved_items_owner_all`).
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { EntityKind, EntityRef } from "@/lib/schema/entity-kind";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? (await createServerSupabase());
}

export type SavedRow = Database["public"]["Tables"]["saved_items"]["Row"];

export type NewSave = {
  user_id: string;
  entity_type: EntityKind;
  entity_id: string;
  entity_title: string;
  entity_subtitle?: string | null;
};

/**
 * Build the canonical "kind:id" key used everywhere we have to talk
 * about a polymorphic entity reference as a single string (Sets, query
 * keys, etc.).
 */
export function refKey(ref: Pick<EntityRef, "kind" | "id">): string {
  return `${ref.kind}:${ref.id}`;
}

/**
 * Existence check for a batch of refs in a single round trip. Returns
 * the set of `"kind:id"` keys that have a saved row for this user.
 */
export async function listSavesForEntities(
  userId: string,
  refs: ReadonlyArray<Pick<EntityRef, "kind" | "id">>,
  client?: Client,
): Promise<Set<string>> {
  if (refs.length === 0) return new Set();
  const sb = await getClient(client);

  const kinds = Array.from(new Set(refs.map((r) => r.kind)));
  const ids = Array.from(new Set(refs.map((r) => r.id)));

  const { data, error } = await sb
    .from("saved_items")
    .select("entity_type, entity_id")
    .eq("user_id", userId)
    .in("entity_type", kinds)
    .in("entity_id", ids);
  if (error) {
    console.warn(`saves.listSavesForEntities: ${error.message}`);
    return new Set();
  }

  // Round-trip is faster (1 query) but `(type IN x) AND (id IN y)` may
  // pull rows we didn't ask about (e.g. same id under a different
  // type). Filter client-side against the explicit pair set.
  const wanted = new Set(refs.map(refKey));
  const out = new Set<string>();
  for (const r of data ?? []) {
    const key = `${r.entity_type}:${r.entity_id}`;
    if (wanted.has(key)) out.add(key);
  }
  return out;
}

export async function insertSave(
  input: NewSave,
  client?: Client,
): Promise<SavedRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("saved_items")
    .insert({
      user_id: input.user_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      entity_title: input.entity_title,
      entity_subtitle: input.entity_subtitle ?? null,
    })
    .select("*")
    .single();
  if (error) {
    // Unique constraint (user, type, id) — treat as success and
    // re-fetch the existing row.
    if (error.code === "23505") {
      return getOne({ userId: input.user_id, kind: input.entity_type, id: input.entity_id }, sb);
    }
    console.warn(`saves.insertSave: ${error.message}`);
    return null;
  }
  return data;
}

export async function deleteSave(
  args: { userId: string; kind: EntityKind; id: string },
  client?: Client,
): Promise<boolean> {
  const sb = await getClient(client);
  const { error } = await sb
    .from("saved_items")
    .delete()
    .eq("user_id", args.userId)
    .eq("entity_type", args.kind)
    .eq("entity_id", args.id);
  if (error) {
    console.warn(`saves.deleteSave: ${error.message}`);
    return false;
  }
  return true;
}

async function getOne(
  args: { userId: string; kind: EntityKind; id: string },
  client?: Client,
): Promise<SavedRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("saved_items")
    .select("*")
    .eq("user_id", args.userId)
    .eq("entity_type", args.kind)
    .eq("entity_id", args.id)
    .maybeSingle();
  if (error) {
    console.warn(`saves.getOne: ${error.message}`);
    return null;
  }
  return data;
}

export type ListSavesArgs = {
  userId: string;
  types?: EntityKind[];
  sort?: "recent" | "alpha";
  limit?: number;
  offset?: number;
};

export type ListSavesResult = {
  rows: SavedRow[];
  total: number;
};

/**
 * Paginated list of the user's saves for the `/saved` index.
 * Denormalised columns (`entity_title`, `entity_subtitle`) make this a
 * single query with no joins.
 */
export async function listSavesForUser(
  args: ListSavesArgs,
  client?: Client,
): Promise<ListSavesResult> {
  const sb = await getClient(client);
  const limit = Math.min(args.limit ?? 30, 100);
  const offset = Math.max(args.offset ?? 0, 0);

  let q = sb
    .from("saved_items")
    .select("*", { count: "exact" })
    .eq("user_id", args.userId);
  if (args.types && args.types.length > 0) {
    q = q.in("entity_type", args.types);
  }
  if (args.sort === "alpha") {
    q = q.order("entity_title", { ascending: true });
  } else {
    q = q.order("created_at", { ascending: false });
  }
  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    console.warn(`saves.listSavesForUser: ${error.message}`);
    return { rows: [], total: 0 };
  }
  return { rows: data ?? [], total: count ?? 0 };
}

/**
 * Distinct counts grouped by entity_type, for the `/saved` filter
 * sidebar's "All (123) | People (12) | …" pills. One small query.
 */
export async function countSavesByType(
  userId: string,
  client?: Client,
): Promise<Record<string, number>> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("saved_items")
    .select("entity_type")
    .eq("user_id", userId);
  if (error) {
    console.warn(`saves.countSavesByType: ${error.message}`);
    return {};
  }
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    out[r.entity_type] = (out[r.entity_type] ?? 0) + 1;
  }
  return out;
}
