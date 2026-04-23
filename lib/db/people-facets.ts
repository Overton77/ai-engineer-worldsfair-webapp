import "server-only";

import { createServerSupabase } from "@/lib/supabase/server";

import {
  PeopleFacetsSchema,
  EMPTY_PEOPLE_FACETS,
} from "./people-facets-shared";
import type { PeopleFacets, PeopleFacetsArgs } from "./people-facets-shared";

/**
 * Sidebar facet counts for /explore/people. Wraps the
 * `explore_people_facets` RPC and validates its jsonb shape.
 */

export {
  EMPTY_PEOPLE_FACETS,
  type PeopleFacets,
  type PeopleFacetsArgs,
  type RoleFacet,
  type OrgFacet,
  type TagFacet,
} from "./people-facets-shared";

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
