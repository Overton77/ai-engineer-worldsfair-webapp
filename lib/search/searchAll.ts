import type { SupabaseClient } from "@supabase/supabase-js";

import { ENTITY_KINDS } from "@/lib/schema/entity-kind";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { SearchAllRowSchema, type SearchAllArgs, type SearchAllRow } from "./types";

type Client = SupabaseClient<Database>;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const KIND_SET = new Set<string>(ENTITY_KINDS);

function sanitizeKinds(kinds: SearchAllArgs["kinds"]): string[] | undefined {
  if (!kinds || kinds.length === 0) return undefined;
  const filtered = kinds.filter((k) => KIND_SET.has(k));
  return filtered.length > 0 ? Array.from(new Set(filtered)) : undefined;
}

function clampLimit(input: number | undefined): number {
  const n = input ?? DEFAULT_LIMIT;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

/**
 * Cross-entity full-text search over the unified `search_all` Postgres
 * RPC. Returns ranked rows (per-table FTS + ts_rank_cd, fused by the
 * RPC) typed by `entity_kind`.
 *
 * Inject `client` for tests / scripts; otherwise uses the server SSR
 * client so RLS scoping works.
 */
export async function searchAll(
  args: SearchAllArgs,
  client?: Client,
): Promise<SearchAllRow[]> {
  const trimmed = args.query.trim();
  if (!trimmed) return [];

  const sb = client ?? (await createServerSupabase());
  const { data, error } = await sb.rpc("search_all", {
    q: trimmed,
    kinds: sanitizeKinds(args.kinds),
    limit_count: clampLimit(args.limit),
  });
  if (error) throw new Error(`search_all failed: ${error.message}`);

  return (data ?? [])
    .map((row) => SearchAllRowSchema.safeParse(row))
    .filter(
      (parsed): parsed is { success: true; data: SearchAllRow } =>
        parsed.success,
    )
    .map((p) => p.data);
}
