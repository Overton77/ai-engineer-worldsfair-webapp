import { z } from "zod";

import type {
  CategoryKey,
  DomainLayer,
} from "@/lib/schema/taxonomy";

import type { RoleBucket } from "./people-roles";

/**
 * Pure (no server-only deps) constants and types used by both
 * server-side `exploreEntities()` and client-side UI shells.
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

export const EXPLORE_SORTS = [
  "relevance",
  "popularity",
  "recent",
  "alpha",
] as const;
export type ExploreSort = (typeof EXPLORE_SORTS)[number];

/** Which sort options each kind actually supports / makes sense for. */
export const KIND_SORT_OPTIONS: Record<ExploreKind, readonly ExploreSort[]> = {
  // Keep non-video sort controls hidden for now. The RPCs expose generic
  // sort strings, but the database types do not make the meaning clear
  // enough per entity to present user-facing choices.
  person: ["relevance"],
  organization: ["relevance"],
  library: ["relevance"],
  paper: ["relevance"],
  session: ["relevance"],
  youtube_video: ["relevance", "popularity", "recent", "alpha"],
};

/** Default sort when there is no q. */
export const KIND_DEFAULT_SORT_NO_Q: Record<ExploreKind, ExploreSort> = {
  person: "relevance",
  organization: "relevance",
  library: "relevance",
  paper: "relevance",
  session: "relevance",
  youtube_video: "popularity",
};

export type ExploreFilters = {
  q?: string;
  layers?: readonly DomainLayer[];
  categories?: readonly CategoryKey[];
  tags?: readonly string[];
  /** People-only: derived role classifier. */
  roleBuckets?: readonly RoleBucket[];
  /** People-only: organization ids (resolved from primary_org_id). */
  orgIds?: readonly string[];
  sort?: ExploreSort;
  limit?: number;
  offset?: number;
};

/**
 * Wire-level row shape every `explore_<kind>` RPC returns. The three
 * trailing fields (`org_id`, `org_name`, `role_bucket`) are People-
 * specific — other RPCs leave them undefined and the schema treats
 * them as optional.
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
  org_id: z.string().nullable().optional(),
  org_name: z.string().nullable().optional(),
  role_bucket: z.string().nullable().optional(),
});

export type ExploreRow = z.infer<typeof ExploreRowSchema>;

export type ExploreResult = {
  rows: ExploreRow[];
  total: number;
};

// ────────────────────────────────────────────────────────────────────
// Per-kind filter spec
// ────────────────────────────────────────────────────────────────────
//
// Drives both the URL state shape and the FilterSidebar composition.
// Each kind page declares which dimensions exist; the sidebar only
// renders the relevant groups.

export type FilterDimension =
  | "layers"
  | "categories"
  | "tags"
  | "roleBuckets"
  | "orgs";

export const KIND_FILTER_DIMENSIONS: Record<
  ExploreKind,
  readonly FilterDimension[]
> = {
  person: ["roleBuckets", "orgs"],
  // Organizations, Libraries, Papers, and Talks have fields that could
  // eventually support filters, but no entity-specific facet data in the
  // current types. Hiding them avoids empty or misleading controls.
  organization: [],
  library: [],
  paper: [],
  session: [],
  youtube_video: ["layers", "categories"],
};

export function kindHasDimension(
  kind: ExploreKind,
  dim: FilterDimension,
): boolean {
  return KIND_FILTER_DIMENSIONS[kind].includes(dim);
}
