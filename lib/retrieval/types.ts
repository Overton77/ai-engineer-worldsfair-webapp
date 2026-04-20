import type { Database } from "@/types/database.types";

/**
 * The enumerated `chunk.source_kind` values supported by the schema.
 * Generated database types expose this as `string`; we narrow it here for
 * caller ergonomics. Keep in sync with the chunk_source_kind_check
 * constraint in `supabase/migrations/20260418120700_add_chunk_store_and_match_chunks.sql`.
 */
export type ChunkSourceKind =
  | "video_summary"
  | "video_transcript_segment"
  | "video_description"
  | "video_chapter"
  | "session_description"
  | "doc_page"
  | "repo_readme"
  | "repo_example"
  | "repo_doc"
  | "paper_abstract"
  | "paper_section"
  | "slide"
  | "dossier"
  | "report_section"
  | "news_item_body"
  | "module_body"
  | "custom";

/**
 * Shape of the `chunk.metadata` jsonb pocket. Every field is optional and
 * agents can add ad-hoc keys, but these are the canonical names that the
 * retrieval contract recognizes (used by filter chips, citation rendering,
 * and downstream analytics).
 */
export interface ChunkMetadata {
  video_id?: string;
  session_id?: string;
  category?: string;
  domain_layer?: string;
  person_slugs?: string[];
  org_slugs?: string[];
  library_slugs?: string[];
  product_slugs?: string[];
  paper_slugs?: string[];
  topic_tags?: string[];
  event?: string;
  published_at?: string;
  url?: string;
  [k: string]: unknown;
}

export interface SearchFilters {
  metadata?: Partial<ChunkMetadata>;
  sourceKinds?: ChunkSourceKind[];
}

export interface SearchOptions {
  matchCount?: number;
  fullTextWeight?: number;
  semanticWeight?: number;
  rrfK?: number;
}

export interface SearchHit {
  chunkId: string;
  sourceKind: ChunkSourceKind;
  sourceId: string;
  ord: number;
  content: string;
  metadata: ChunkMetadata;
  rrfScore: number;
}

export type ChunkRow = Database["public"]["Tables"]["chunk"]["Row"];
export type ChunkInsert = Database["public"]["Tables"]["chunk"]["Insert"];
export type MatchChunksArgs =
  Database["public"]["Functions"]["match_chunks"]["Args"];
export type MatchChunksResult =
  Database["public"]["Functions"]["match_chunks"]["Returns"];
