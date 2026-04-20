import type { SupabaseClient } from "@supabase/supabase-js";

import { ENTITY_KINDS } from "@/lib/schema/entity-kind";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import {
  SearchFuzzyRowSchema,
  type SearchFuzzyArgs,
  type SearchFuzzyRow,
} from "./types";

type Client = SupabaseClient<Database>;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const KIND_SET = new Set<string>(ENTITY_KINDS);

function sanitizeKinds(kinds: SearchFuzzyArgs["kinds"]): string[] | undefined {
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
 * Trigram-similarity prefix search via the `search_fuzzy` Postgres RPC.
 * Powers cmd-K (U3.1) where typing-as-you-go needs sub-200ms results.
 *
 * Returns rows sorted by `similarity` DESC. We do **not** match against
 * `entity_id` or `slug` — only `title` is fuzzy-matched server-side.
 */
export async function searchFuzzy(
  args: SearchFuzzyArgs,
  client?: Client,
): Promise<SearchFuzzyRow[]> {
  const trimmed = args.prefix.trim();
  if (!trimmed) return [];

  const sb = client ?? (await createServerSupabase());
  const { data, error } = await sb.rpc("search_fuzzy", {
    prefix: trimmed,
    kinds: sanitizeKinds(args.kinds),
    limit_count: clampLimit(args.limit),
  });
  if (error) throw new Error(`search_fuzzy failed: ${error.message}`);

  return (data ?? [])
    .map((row) => SearchFuzzyRowSchema.safeParse(row))
    .filter(
      (parsed): parsed is { success: true; data: SearchFuzzyRow } =>
        parsed.success,
    )
    .map((p) => p.data);
}
