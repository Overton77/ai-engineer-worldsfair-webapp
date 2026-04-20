import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

/**
 * Entity kinds that have a per-entity Explore RPC. The `/explore/[type]`
 * UI is constrained to this allowlist; any other type 404s.
 */
export const EXPLORE_KINDS = [
  "person",
  "organization",
  "library",
  "paper",
  "session",
  "youtube_video",
] as const;

export type ExploreKind = (typeof EXPLORE_KINDS)[number];

export const ExploreKindSchema = z.enum(EXPLORE_KINDS);

export const EXPLORE_KIND_LABELS: Record<ExploreKind, string> = {
  person: "People",
  organization: "Organizations",
  library: "Libraries",
  paper: "Papers",
  session: "Talks",
  youtube_video: "Videos",
};

/**
 * Sort modes the Explore UI exposes. `relevance` is only meaningful when
 * `q` is non-empty (otherwise the SQL falls back to the kind's default).
 */
export const EXPLORE_SORTS = [
  "relevance",
  "popularity",
  "recent",
  "alpha",
] as const;
export type ExploreSort = (typeof EXPLORE_SORTS)[number];

export type ExploreFilters = {
  q?: string;
  layers?: readonly DomainLayer[];
  categories?: readonly CategoryKey[];
  tags?: readonly string[];
  sort?: ExploreSort;
  limit?: number;
  offset?: number;
};

/**
 * The shape every `explore_<kind>` RPC returns. Matches the SQL function
 * signature (`out_tags` because `tags` is the input parameter name).
 */
export const ExploreRowSchema = z.object({
  entity_id: z.string(),
  slug: z.string().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
  image_url: z.string().nullable(),
  description: z.string().nullable(),
  snippet: z.string().nullable(),
  rank: z.number().nullable(),
  popularity: z.number().nullable(),
  recent_at: z.string().nullable(),
  total_count: z.number(),
  layer: z.string().nullable(),
  category: z.string().nullable(),
  out_tags: z.array(z.string()).nullable(),
});

export type ExploreRow = z.infer<typeof ExploreRowSchema>;

export type ExploreResult = {
  rows: ExploreRow[];
  total: number;
};

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

const KIND_TO_RPC: Record<ExploreKind, ExploreRpc> = {
  person: "explore_people",
  organization: "explore_organizations",
  library: "explore_libraries",
  paper: "explore_papers",
  session: "explore_sessions",
  youtube_video: "explore_youtube_videos",
};

type ExploreRpc =
  | "explore_people"
  | "explore_organizations"
  | "explore_libraries"
  | "explore_papers"
  | "explore_sessions"
  | "explore_youtube_videos";

const LAYER_SET = new Set<string>(DOMAIN_LAYERS);
const CATEGORY_SET = new Set<string>(CATEGORY_KEYS);
const SORT_SET = new Set<string>(EXPLORE_SORTS);

function sanitizeStringArray(
  input: readonly string[] | undefined,
  whitelist: ReadonlySet<string>,
): string[] | undefined {
  if (!input || input.length === 0) return undefined;
  const out = Array.from(new Set(input.filter((s) => whitelist.has(s))));
  return out.length > 0 ? out : undefined;
}

function sanitizeFreeTags(
  input: readonly string[] | undefined,
): string[] | undefined {
  if (!input || input.length === 0) return undefined;
  const out = Array.from(
    new Set(input.map((s) => s.trim()).filter((s) => s.length > 0)),
  );
  return out.length > 0 ? out : undefined;
}

function clampLimit(input: number | undefined): number {
  const n = input ?? DEFAULT_LIMIT;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

function clampOffset(input: number | undefined): number {
  const n = input ?? 0;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function pickSort(
  q: string,
  sort: ExploreSort | undefined,
): ExploreSort {
  if (sort && SORT_SET.has(sort)) return sort;
  return q.length > 0 ? "relevance" : "popularity";
}

/**
 * Per-entity-kind Explore search. Wraps the matching `explore_<kind>`
 * RPC with type-safe input sanitisation and zod-validated output.
 *
 * Returns an empty result with `total=0` for unknown kinds rather than
 * throwing — UI consumers render an empty state.
 */
export async function exploreEntities(
  kind: ExploreKind,
  filters: ExploreFilters,
  client?: Client,
): Promise<ExploreResult> {
  const rpcName = KIND_TO_RPC[kind];
  const sb = client ?? (await createServerSupabase());
  const trimmedQ = (filters.q ?? "").trim();

  const args = {
    q: trimmedQ.length > 0 ? trimmedQ : undefined,
    layers: sanitizeStringArray(filters.layers, LAYER_SET),
    categories: sanitizeStringArray(filters.categories, CATEGORY_SET),
    tags: sanitizeFreeTags(filters.tags),
    sort: pickSort(trimmedQ, filters.sort),
    limit_count: clampLimit(filters.limit),
    offset_count: clampOffset(filters.offset),
  };

  const { data, error } = await sb.rpc(rpcName, args);
  if (error) {
    throw new Error(`${rpcName} failed: ${error.message}`);
  }

  const parsed = (data ?? [])
    .map((row) => ExploreRowSchema.safeParse(row))
    .filter(
      (p): p is { success: true; data: ExploreRow } => p.success,
    )
    .map((p) => p.data);

  return {
    rows: parsed,
    total: parsed[0]?.total_count ?? 0,
  };
}
