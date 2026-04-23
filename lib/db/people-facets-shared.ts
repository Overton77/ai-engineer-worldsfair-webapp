import { z } from "zod";

import { ROLE_BUCKETS } from "@/lib/search/people-roles";

/**
 * Schemas, types, and empty state for people explore facets. Safe to import
 * from Client Components — do not add server-only or Supabase here. Server
 * RPC logic lives in `people-facets.ts`.
 */

const RoleFacetSchema = z.object({
  value: z.enum(ROLE_BUCKETS),
  count: z.number(),
});

const OrgFacetSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  logo_url: z.string().nullable(),
  count: z.number(),
});

const TagFacetSchema = z.object({
  value: z.string(),
  count: z.number(),
});

export const PeopleFacetsSchema = z.object({
  role_buckets: z.array(RoleFacetSchema),
  orgs: z.array(OrgFacetSchema),
  tags: z.array(TagFacetSchema),
});

export type RoleFacet = z.infer<typeof RoleFacetSchema>;
export type OrgFacet = z.infer<typeof OrgFacetSchema>;
export type TagFacet = z.infer<typeof TagFacetSchema>;
export type PeopleFacets = z.infer<typeof PeopleFacetsSchema>;

export const EMPTY_PEOPLE_FACETS: PeopleFacets = {
  role_buckets: [],
  orgs: [],
  tags: [],
};

export type PeopleFacetsArgs = {
  q?: string;
  tags?: readonly string[];
  roleBuckets?: readonly string[];
  orgIds?: readonly string[];
  /** Per-facet cap. Defaults to 30 to match the SQL default. */
  facetLimit?: number;
};
