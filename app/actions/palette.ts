"use server";

import { z } from "zod";

import { searchFuzzy } from "@/lib/search/searchFuzzy";
import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";

const PaletteArgsSchema = z.object({
  prefix: z.string().min(1).max(120),
  kinds: z.array(z.enum(ENTITY_KINDS)).optional(),
  limit: z.number().int().positive().max(50).optional(),
});

export type PaletteHit = {
  kind: EntityKind;
  id: string;
  slug: string | null;
  title: string;
  imageUrl: string | null;
  similarity: number;
};

/**
 * Server Action backing the global ⌘K palette. Wraps `searchFuzzy`
 * (pg_trgm) so as-you-type queries stay sub-200ms even on small
 * result counts.
 */
export async function searchPaletteAction(input: {
  prefix: string;
  kinds?: readonly EntityKind[];
  limit?: number;
}): Promise<PaletteHit[]> {
  const parsed = PaletteArgsSchema.safeParse({
    prefix: input.prefix,
    kinds: input.kinds,
    limit: input.limit,
  });
  if (!parsed.success) return [];

  const rows = await searchFuzzy({
    prefix: parsed.data.prefix,
    kinds: parsed.data.kinds,
    limit: parsed.data.limit ?? 12,
  });

  return rows.map((r) => ({
    kind: r.entity_kind,
    id: r.entity_id,
    slug: r.slug,
    title: r.title,
    imageUrl: r.image_url ?? null,
    similarity: r.similarity,
  }));
}
