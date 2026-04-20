/**
 * Follow-graph DAL — `(user_id, entity_kind, entity_id)` polymorphic
 * follow rows. Allows following entities (people, orgs, libraries…)
 * AND virtual entities (`category`, `domain_layer`).
 *
 * Reads use the SSR Supabase client (RLS scopes everything to the
 * caller via `profile_followed_entity_owner_all`).
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { FollowEntityKind } from "@/lib/schema/entity-kind";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? (await createServerSupabase());
}

export type FollowRow =
  Database["public"]["Tables"]["profile_followed_entity"]["Row"];

export function followKey(ref: { kind: string; id: string }): string {
  return `${ref.kind}:${ref.id}`;
}

/**
 * Existence check for a batch of follow refs in one round trip.
 * Returns the set of `"kind:id"` keys this user already follows.
 */
export async function listFollowsForEntities(
  userId: string,
  refs: ReadonlyArray<{ kind: FollowEntityKind; id: string }>,
  client?: Client,
): Promise<Set<string>> {
  if (refs.length === 0) return new Set();
  const sb = await getClient(client);
  const kinds = Array.from(new Set(refs.map((r) => r.kind)));
  const ids = Array.from(new Set(refs.map((r) => r.id)));

  const { data, error } = await sb
    .from("profile_followed_entity")
    .select("entity_kind, entity_id")
    .eq("user_id", userId)
    .in("entity_kind", kinds)
    .in("entity_id", ids);
  if (error) {
    console.warn(`follows.listFollowsForEntities: ${error.message}`);
    return new Set();
  }

  const wanted = new Set(refs.map(followKey));
  const out = new Set<string>();
  for (const r of data ?? []) {
    const key = `${r.entity_kind}:${r.entity_id}`;
    if (wanted.has(key)) out.add(key);
  }
  return out;
}

export type NewFollow = {
  user_id: string;
  entity_kind: FollowEntityKind;
  entity_id: string;
};

export async function insertFollow(
  input: NewFollow,
  client?: Client,
): Promise<FollowRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("profile_followed_entity")
    .insert({
      user_id: input.user_id,
      entity_kind: input.entity_kind,
      entity_id: input.entity_id,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") {
      // already-follows; treat as success
      const { data: existing } = await sb
        .from("profile_followed_entity")
        .select("*")
        .eq("user_id", input.user_id)
        .eq("entity_kind", input.entity_kind)
        .eq("entity_id", input.entity_id)
        .maybeSingle();
      return existing;
    }
    console.warn(`follows.insertFollow: ${error.message}`);
    return null;
  }
  return data;
}

export async function deleteFollow(
  args: { userId: string; kind: FollowEntityKind; id: string },
  client?: Client,
): Promise<boolean> {
  const sb = await getClient(client);
  const { error } = await sb
    .from("profile_followed_entity")
    .delete()
    .eq("user_id", args.userId)
    .eq("entity_kind", args.kind)
    .eq("entity_id", args.id);
  if (error) {
    console.warn(`follows.deleteFollow: ${error.message}`);
    return false;
  }
  return true;
}

export type ListFollowsArgs = {
  userId: string;
  kinds?: FollowEntityKind[];
  sort?: "recent" | "alpha";
  limit?: number;
  offset?: number;
};

export type ListFollowsResult = {
  rows: FollowRow[];
  total: number;
};

export async function listFollowsForUser(
  args: ListFollowsArgs,
  client?: Client,
): Promise<ListFollowsResult> {
  const sb = await getClient(client);
  const limit = Math.min(args.limit ?? 30, 100);
  const offset = Math.max(args.offset ?? 0, 0);
  let q = sb
    .from("profile_followed_entity")
    .select("*", { count: "exact" })
    .eq("user_id", args.userId);
  if (args.kinds && args.kinds.length > 0) {
    q = q.in("entity_kind", args.kinds);
  }
  // entity_kind / entity_id sort makes sense for "alpha" since the row
  // doesn't denorm titles; the page resolves titles via entity-summary.
  q = q.order("created_at", { ascending: false });
  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    console.warn(`follows.listFollowsForUser: ${error.message}`);
    return { rows: [], total: 0 };
  }
  return { rows: data ?? [], total: count ?? 0 };
}

export async function countFollowsByKind(
  userId: string,
  client?: Client,
): Promise<Record<string, number>> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("profile_followed_entity")
    .select("entity_kind")
    .eq("user_id", userId);
  if (error) {
    console.warn(`follows.countFollowsByKind: ${error.message}`);
    return {};
  }
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    out[r.entity_kind] = (out[r.entity_kind] ?? 0) + 1;
  }
  return out;
}
