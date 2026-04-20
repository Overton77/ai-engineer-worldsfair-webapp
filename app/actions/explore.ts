"use server";

import { z } from "zod";

import {
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
} from "@/lib/schema/taxonomy";
import {
  EXPLORE_KINDS,
  EXPLORE_SORTS,
  exploreEntities,
  type ExploreResult,
} from "@/lib/search/explore";

const ArgsSchema = z.object({
  kind: z.enum(EXPLORE_KINDS),
  q: z.string().max(200).optional(),
  layers: z.array(z.enum(DOMAIN_LAYERS)).optional(),
  categories: z.array(z.enum(CATEGORY_KEYS)).optional(),
  tags: z.array(z.string().min(1).max(64)).optional(),
  sort: z.enum(EXPLORE_SORTS).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export async function exploreAction(
  input: z.input<typeof ArgsSchema>,
): Promise<ExploreResult> {
  const parsed = ArgsSchema.safeParse(input);
  if (!parsed.success) return { rows: [], total: 0 };
  const { kind, ...filters } = parsed.data;
  return exploreEntities(kind, filters);
}
