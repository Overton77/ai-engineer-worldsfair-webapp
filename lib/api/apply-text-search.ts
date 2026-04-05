/**
 * Applies Postgres full-text search on the generated `fts` tsvector column.
 * Requires migration `20260404020336_add_fulltext_search_fts_columns` on the Supabase project.
 */
export const FTS_OPTIONS = {
  type: "websearch" as const,
  config: "english",
}
