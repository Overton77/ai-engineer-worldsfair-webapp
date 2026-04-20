import type {
  ChunkMetadata,
  ChunkSourceKind,
  SearchFilters,
} from "./types";

/**
 * Translates URL search params (e.g. from a chip-driven filter UI) into the
 * shape expected by `search()`. Single-value keys map to scalar metadata
 * fields; repeated keys map to text[] metadata fields; `source_kind` may be
 * repeated to filter by multiple artifact kinds.
 *
 * Example:
 *   ?category=evaluations&org_slugs=agenta&org_slugs=braintrust&source_kind=video_summary
 *   →
 *   {
 *     metadata: { category: "evaluations", org_slugs: ["agenta", "braintrust"] },
 *     sourceKinds: ["video_summary"],
 *   }
 */

const SCALAR_KEYS = [
  "category",
  "domain_layer",
  "video_id",
  "session_id",
  "event",
  "published_at",
  "url",
] as const;

const ARRAY_KEYS = [
  "person_slugs",
  "org_slugs",
  "library_slugs",
  "product_slugs",
  "paper_slugs",
  "topic_tags",
] as const;

const VALID_SOURCE_KINDS: ReadonlySet<ChunkSourceKind> = new Set([
  "video_summary",
  "video_transcript_segment",
  "video_description",
  "video_chapter",
  "session_description",
  "doc_page",
  "repo_readme",
  "repo_example",
  "repo_doc",
  "paper_abstract",
  "paper_section",
  "slide",
  "dossier",
  "report_section",
  "news_item_body",
  "module_body",
  "custom",
]);

function isValidSourceKind(value: string): value is ChunkSourceKind {
  return VALID_SOURCE_KINDS.has(value as ChunkSourceKind);
}

export function buildFiltersFromSearchParams(
  sp: URLSearchParams,
): SearchFilters {
  const metadata: Partial<ChunkMetadata> = {};

  for (const key of SCALAR_KEYS) {
    const value = sp.get(key);
    if (value) metadata[key] = value;
  }

  for (const key of ARRAY_KEYS) {
    const values = sp.getAll(key).filter(Boolean);
    if (values.length > 0) metadata[key] = values;
  }

  const rawSourceKinds = sp.getAll("source_kind").filter(Boolean);
  const sourceKinds = rawSourceKinds.filter(isValidSourceKind);

  return {
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    sourceKinds: sourceKinds.length > 0 ? sourceKinds : undefined,
  };
}

/**
 * Combine multiple filter sets into one. Later filters override earlier
 * scalar fields; array fields are concatenated and de-duplicated.
 */
export function mergeFilters(...filters: SearchFilters[]): SearchFilters {
  const out: SearchFilters = {};
  const metadata: Partial<ChunkMetadata> = {};
  const sourceKinds = new Set<ChunkSourceKind>();

  for (const f of filters) {
    if (f.metadata) {
      for (const [key, value] of Object.entries(f.metadata)) {
        if (Array.isArray(value)) {
          const prev = (metadata[key] as string[] | undefined) ?? [];
          metadata[key] = Array.from(new Set([...prev, ...value]));
        } else if (value !== undefined && value !== null) {
          metadata[key] = value as never;
        }
      }
    }
    if (f.sourceKinds) {
      for (const k of f.sourceKinds) sourceKinds.add(k);
    }
  }

  if (Object.keys(metadata).length > 0) out.metadata = metadata;
  if (sourceKinds.size > 0) out.sourceKinds = Array.from(sourceKinds);
  return out;
}
