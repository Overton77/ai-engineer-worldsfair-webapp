import "server-only";

import { z } from "zod";

import { createServerSupabase } from "@/lib/supabase/server";
import { ROLE_BUCKETS } from "@/lib/search/people-roles";

/**
 * Sidebar facet counts for /explore/people. Wraps the
 * `explore_people_facets` RPC and validates its jsonb shape.
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

const PeopleFacetsSchema = z.object({
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

function clean(input: readonly string[] | undefined): string[] | undefined {
  if (!input || input.length === 0) return undefined;
  const out = Array.from(
    new Set(input.map((s) => s.trim()).filter((s) => s.length > 0)),
  );
  return out.length > 0 ? out : undefined;
}

export async function getPeopleFacets(
  args: PeopleFacetsArgs,
): Promise<PeopleFacets> {
  const sb = await createServerSupabase();
  const trimmedQ = (args.q ?? "").trim();
  const { data, error } = await sb.rpc("explore_people_facets", {
    q: trimmedQ.length > 0 ? trimmedQ : undefined,
    tags: clean(args.tags),
    role_buckets: clean(args.roleBuckets),
    org_ids: clean(args.orgIds),
    facet_limit: args.facetLimit ?? 30,
  });

  if (error) {
    console.warn("explore_people_facets failed:", error.message);
    return EMPTY_PEOPLE_FACETS;
  }

  const parsed = PeopleFacetsSchema.safeParse(data);
  if (!parsed.success) {
    console.warn("explore_people_facets shape mismatch:", parsed.error);
    return EMPTY_PEOPLE_FACETS;
  }
  return parsed.data;
}
