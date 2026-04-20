import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

import { embedQuery } from "./embedder";
import type {
  ChunkMetadata,
  ChunkSourceKind,
  MatchChunksArgs,
  SearchFilters,
  SearchHit,
  SearchOptions,
} from "./types";

type Client = SupabaseClient<Database>;

export interface SearchArgs {
  /** Free-text user query. Used both for embedding and for FTS websearch_to_tsquery. */
  query: string;
  /** Optional metadata + source-kind filters AND'd into both halves of the hybrid search. */
  filters?: SearchFilters;
  /** Tuning knobs for match count and RRF weights. */
  options?: SearchOptions;
  /**
   * Inject a Supabase client (e.g. service-role for scripts/route-handlers).
   * If omitted, uses createServerSupabase() — works in Server Components,
   * Route Handlers, and Server Actions.
   */
  client?: Client;
}

const DEFAULT_MATCH_COUNT = 12;
const DEFAULT_FULL_TEXT_WEIGHT = 1.0;
const DEFAULT_SEMANTIC_WEIGHT = 1.0;
const DEFAULT_RRF_K = 50;

/**
 * Hybrid retrieval over `public.chunk` via the `match_chunks` RPC. Combines
 * HNSW vector ANN with FTS via Reciprocal Rank Fusion (see
 * `aiwiki/docs/05-retrieval-architecture.md`). Returns chunk hits with the
 * RRF score; callers can render citations, build context blocks, or rerank
 * further.
 *
 * This is the single public retrieval surface — every caller (assistant
 * route, search page, scripts) goes through `search()` so swapping
 * pgvector → Pinecone/Bedrock later only changes this file + embedder.ts.
 */
export async function search({
  query,
  filters = {},
  options = {},
  client,
}: SearchArgs): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const sb = client ?? (await createServerSupabase());

  const queryEmbedding = await embedQuery(trimmed);

  const args: MatchChunksArgs = {
    // supabase-js types pgvector params as `string`; the wire format accepts
    // a JSON-array literal, but the JS client also accepts number[] in
    // practice. Cast keeps typings happy.
    query_embedding: queryEmbedding as unknown as string,
    query_text: trimmed,
    filter: (filters.metadata ?? {}) as never,
    source_kinds: filters.sourceKinds ?? undefined,
    match_count: options.matchCount ?? DEFAULT_MATCH_COUNT,
    full_text_weight: options.fullTextWeight ?? DEFAULT_FULL_TEXT_WEIGHT,
    semantic_weight: options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT,
    rrf_k: options.rrfK ?? DEFAULT_RRF_K,
  };

  const { data, error } = await sb.rpc("match_chunks", args);
  if (error) {
    throw new Error(`match_chunks failed: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    chunkId: row.chunk_id,
    sourceKind: row.source_kind as ChunkSourceKind,
    sourceId: row.source_id,
    ord: row.ord,
    content: row.content,
    metadata: (row.metadata ?? {}) as ChunkMetadata,
    rrfScore: Number(row.rrf_score),
  }));
}

/**
 * Format the hits into a single context block suitable for handing to an LLM
 * with inline citations. Each chunk is prefixed with `[n]` so the model can
 * cite, and the citations array carries the source pointers for the UI.
 */
export interface ContextBlock {
  contextText: string;
  citations: Array<{
    n: number;
    chunkId: string;
    sourceKind: ChunkSourceKind;
    sourceId: string;
    url?: string;
  }>;
}

export function formatHitsAsContext(hits: SearchHit[]): ContextBlock {
  const citations = hits.map((hit, i) => ({
    n: i + 1,
    chunkId: hit.chunkId,
    sourceKind: hit.sourceKind,
    sourceId: hit.sourceId,
    url: typeof hit.metadata.url === "string" ? hit.metadata.url : undefined,
  }));
  const contextText = hits
    .map(
      (hit, i) =>
        `[${i + 1}] (${hit.sourceKind}:${hit.sourceId}) ${hit.content}`,
    )
    .join("\n\n");
  return { contextText, citations };
}
