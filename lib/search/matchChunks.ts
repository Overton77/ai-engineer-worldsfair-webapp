/**
 * Hybrid retrieval over `public.chunk` via `match_chunks` (RRF fusion
 * of FTS + pgvector). The actual implementation already lives in the
 * pre-existing `lib/retrieval/search.ts` — this file is the canonical
 * entry-point per U1.5 so the rest of the app imports search from one
 * place even when the underlying implementation evolves.
 *
 * The retrieval layer pins the embedder to `cohere.embed-v4:0` @ 1536d
 * (Q1) — see `lib/retrieval/embedder.ts`.
 */

export {
  search as matchChunks,
  formatHitsAsContext,
} from "@/lib/retrieval/search";
export type {
  SearchHit,
  ChunkSourceKind,
  ChunkMetadata,
  SearchFilters,
  SearchOptions,
  MatchChunksArgs,
} from "@/lib/retrieval/types";
