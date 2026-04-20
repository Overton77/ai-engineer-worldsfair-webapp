export { embedQuery, RETRIEVAL_EMBEDDING_DIMS } from "./embedder";
export { buildFiltersFromSearchParams, mergeFilters } from "./filters";
export { search, formatHitsAsContext } from "./search";
export type {
  ChunkMetadata,
  ChunkSourceKind,
  ChunkRow,
  ChunkInsert,
  MatchChunksArgs,
  MatchChunksResult,
  SearchFilters,
  SearchHit,
  SearchOptions,
} from "./types";
export type { ContextBlock, SearchArgs } from "./search";
