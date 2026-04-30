import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
} from "@/lib/schema/taxonomy";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { ROLE_BUCKETS } from "./people-roles";
import {
  EXPLORE_SORTS,
  ExploreRowSchema,
  KIND_DEFAULT_SORT_NO_Q,
  KIND_SORT_OPTIONS,
  type ExploreFilters,
  type ExploreKind,
  type ExploreResult,
  type ExploreRow,
  type ExploreSort,
} from "./explore-shared";

export {
  EXPLORE_KIND_LABELS,
  EXPLORE_KINDS,
  EXPLORE_SORTS,
  ExploreKindSchema,
  ExploreRowSchema,
  KIND_DEFAULT_SORT_NO_Q,
  KIND_FILTER_DIMENSIONS,
  KIND_SORT_OPTIONS,
  kindHasDimension,
  type ExploreFilters,
  type ExploreKind,
  type ExploreResult,
  type ExploreRow,
  type ExploreSort,
  type FilterDimension,
} from "./explore-shared";

type Client = SupabaseClient<Database>;

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
const ROLE_SET = new Set<string>(ROLE_BUCKETS);

function sanitizeStringArray(
  input: readonly string[] | undefined,
  whitelist: ReadonlySet<string>,
): string[] | undefined {
  if (!input || input.length === 0) return undefined;
  const out = Array.from(new Set(input.filter((s) => whitelist.has(s))));
  return out.length > 0 ? out : undefined;
}

function sanitizeFreeStrings(
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
  kind: ExploreKind,
  q: string,
  sort: ExploreSort | undefined,
): ExploreSort {
  const allowed = KIND_SORT_OPTIONS[kind];
  if (sort && SORT_SET.has(sort) && allowed.includes(sort)) return sort;
  return q.length > 0 && allowed.includes("relevance")
    ? "relevance"
    : KIND_DEFAULT_SORT_NO_Q[kind];
}

/**
 * Per-entity-kind Explore search. Wraps the matching `explore_<kind>`
 * RPC with type-safe input sanitisation and zod-validated output.
 *
 * Server-only — UI consumers go through the `exploreAction` Server
 * Action in `app/actions/explore.ts`.
 */
export async function exploreEntities(
  kind: ExploreKind,
  filters: ExploreFilters,
  client?: Client,
): Promise<ExploreResult> {
  const rpcName = KIND_TO_RPC[kind];
  const sb = client ?? (await createServerSupabase());
  const trimmedQ = (filters.q ?? "").trim();

  // Build the args object. People-specific args (role_buckets, org_ids)
  // are only included for the person RPC; including them on other RPCs
  // would be a runtime error since their signatures don't accept them.
  const baseArgs = {
    q: trimmedQ.length > 0 ? trimmedQ : undefined,
    layers: sanitizeStringArray(filters.layers, LAYER_SET),
    categories: sanitizeStringArray(filters.categories, CATEGORY_SET),
    tags: sanitizeFreeStrings(filters.tags),
    sort: pickSort(kind, trimmedQ, filters.sort),
    limit_count: clampLimit(filters.limit),
    offset_count: clampOffset(filters.offset),
  };

  const args =
    kind === "person"
      ? {
          ...baseArgs,
          role_buckets: sanitizeStringArray(filters.roleBuckets, ROLE_SET),
          org_ids: sanitizeFreeStrings(filters.orgIds),
        }
      : baseArgs;

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
