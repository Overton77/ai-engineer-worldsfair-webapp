"use server";

import { z } from "zod";

import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";
import { matchChunks } from "@/lib/search/matchChunks";
import { searchAll } from "@/lib/search/searchAll";

const KindArraySchema = z.array(z.enum(ENTITY_KINDS)).optional();

const LexicalArgsSchema = z.object({
  query: z.string().min(1).max(200),
  kinds: KindArraySchema,
  limit: z.number().int().positive().max(60).optional(),
});

export async function searchAllAction(input: {
  query: string;
  kinds?: readonly EntityKind[];
  limit?: number;
}) {
  const parsed = LexicalArgsSchema.safeParse(input);
  if (!parsed.success) return [];
  return searchAll(parsed.data);
}

const ChunkArgsSchema = z.object({
  query: z.string().min(1).max(200),
  mode: z.enum(["semantic", "hybrid"]).default("hybrid"),
  matchCount: z.number().int().positive().max(40).optional(),
});

/**
 * Chunk-level retrieval used by /search Semantic and Hybrid modes.
 * Semantic mode zeroes out the FTS half of the RRF; Hybrid uses the
 * default 1.0 / 1.0 weights.
 */
export async function searchChunksAction(input: {
  query: string;
  mode?: "semantic" | "hybrid";
  matchCount?: number;
}) {
  const parsed = ChunkArgsSchema.safeParse(input);
  if (!parsed.success) return [];
  const { query, mode, matchCount } = parsed.data;
  return matchChunks({
    query,
    options: {
      matchCount: matchCount ?? 18,
      semanticWeight: 1,
      fullTextWeight: mode === "semantic" ? 0 : 1,
    },
  });
}
