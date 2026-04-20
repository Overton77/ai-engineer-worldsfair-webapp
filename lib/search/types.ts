import { z } from "zod";

import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";

/**
 * Wire-level rows returned by the `search_all` Postgres RPC. We keep
 * the snake_case shape the function returns and pre-validate
 * `entity_kind` via `EntityKindSchema` so downstream pattern matches
 * are exhaustive.
 */
export const SearchAllRowSchema = z.object({
  entity_kind: z.enum(ENTITY_KINDS),
  entity_id: z.string(),
  slug: z.string().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
  image_url: z.string().nullable().optional(),
  snippet: z.string().nullable(),
  rank: z.number(),
});

export type SearchAllRow = z.infer<typeof SearchAllRowSchema>;

export const SearchFuzzyRowSchema = z.object({
  entity_kind: z.enum(ENTITY_KINDS),
  entity_id: z.string(),
  slug: z.string().nullable(),
  title: z.string(),
  image_url: z.string().nullable().optional(),
  similarity: z.number(),
});

export type SearchFuzzyRow = z.infer<typeof SearchFuzzyRowSchema>;

export type SearchKindFilter = readonly EntityKind[] | undefined;

export type SearchAllArgs = {
  query: string;
  kinds?: SearchKindFilter;
  limit?: number;
};

export type SearchFuzzyArgs = {
  prefix: string;
  kinds?: SearchKindFilter;
  limit?: number;
};
