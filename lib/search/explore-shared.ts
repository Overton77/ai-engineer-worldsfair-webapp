import { z } from "zod";

import type {
  CategoryKey,
  DomainLayer,
} from "@/lib/schema/taxonomy";

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
 * Wire-level row shape every `explore_<kind>` RPC returns. Matches the
 * SQL function signature (`out_tags` because `tags` is the input
 * parameter name).
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
