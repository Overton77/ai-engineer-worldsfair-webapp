"use server";

import { z } from "zod";

import {
  EMPTY_PEOPLE_FACETS,
  getPeopleFacets,
  type PeopleFacets,
} from "@/lib/db/people-facets";

const ArgsSchema = z.object({
  q: z.string().max(200).optional(),
  tags: z.array(z.string().min(1).max(64)).optional(),
  roleBuckets: z.array(z.string().min(1).max(40)).optional(),
  orgIds: z.array(z.string().min(1).max(64)).optional(),
});

export async function peopleFacetsAction(
  input: z.input<typeof ArgsSchema>,
): Promise<PeopleFacets> {
  const parsed = ArgsSchema.safeParse(input);
  if (!parsed.success) return EMPTY_PEOPLE_FACETS;
  return getPeopleFacets(parsed.data);
}
