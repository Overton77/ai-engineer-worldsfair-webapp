---
name: supabase-writer
description: The single skill that knows how to write to Supabase from this repo. Use whenever you need to upsert entities (organization/person/library/product/repo/paper), upsert link rows (person_appeared_in_video, etc.), upsert chunks (with Bedrock+Cohere v4 embeddings), backfill search_text + embeddings on existing rows, or apply ad-hoc DDL when the supabase CLI migration history is out of sync. Owns the service-role auth pattern, the per-table idempotency keys, the Bedrock embedder integration, and the Cohere/OpenAI provider-mismatch trap.
---

# Supabase writer

This is the **only** skill in the repo that writes to Supabase. Everything else (vault MD, JSONL, Markdown reports) is filesystem-only. Centralizing writes here keeps the schema-aware logic in one place.

## When to use this skill

Whenever you need to mutate Supabase. The five script families:

| Concern | Script | Idempotency key |
|---|---|---|
| Inspect first (always) | [`scripts/inspect-corpus.ts`](../../../scripts/inspect-corpus.ts) | n/a (read-only) |
| Insert/update entity rows | [`scripts/upsert-entities.ts`](../../../scripts/upsert-entities.ts) | slug per table |
| Insert link rows | [`scripts/upsert-link-tables.ts`](../../../scripts/upsert-link-tables.ts) | composite PK (e.g. `person_id,video_id`) |
| Embed + insert chunks | [`scripts/upsert-chunks.ts`](../../../scripts/upsert-chunks.ts) | `(source_kind, source_id, ord)` and `content_hash` |
| Backfill search_text + embeddings | [`scripts/backfill-search-text-and-embeddings.ts`](../../../scripts/backfill-search-text-and-embeddings.ts) | per-row PK, scoped to `--video-id`/`--bucket` |
| Ad-hoc DDL when migration history is out of sync | [`scripts/apply-sql.ts`](../../../scripts/apply-sql.ts) | n/a (DDL is generally `IF NOT EXISTS` /` IF EXISTS`) |

## End-to-end recipe (proven on CEvIs9y1uog, agent_orchestration)

Run from `aiengineerapp/`:

```bash
# 0. Sanity-check the embedder once per session
pnpm exec tsx scripts/check-embedder.ts

# 1. Inspect (gate file)
pnpm exec tsx scripts/inspect-corpus.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration

# 2. Upsert entities (refuses without inspection report)
pnpm exec tsx scripts/upsert-entities.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration --dry-run
pnpm exec tsx scripts/upsert-entities.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration

# 3. Upsert link tables (entity edges)
pnpm exec tsx scripts/upsert-link-tables.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration

# 4. Upsert chunks (embeds via Bedrock Cohere v4 in batches of 96)
pnpm exec tsx scripts/upsert-chunks.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration

# 5. Backfill search_text + embeddings on the rows touched by this slice
pnpm exec tsx scripts/backfill-search-text-and-embeddings.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration --force
```

## Critical rules

### Auth

All scripts read from `aiengineerapp/.env` (and `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` -- service-role; bypasses RLS

Never hard-code these. Never commit them (gitignored via `.env*` rule).

### Embedder is Bedrock + Cohere v4 (1536d)

[`lib/retrieval/embedder.ts`](../../../lib/retrieval/embedder.ts) is the single source of truth. Two exports:

```ts
embedQuery(input: string): Promise<number[]>            // input_type=search_query
embedDocuments(inputs: string[], options?): Promise<number[][]>  // input_type=search_document, batch up to 96
```

Auth: `AWS_BEARER_TOKEN_BEDROCK` (Bedrock API key), `AWS_REGION`, `EMBEDDING_MODEL_COHERE` (defaults `cohere.embed-v4:0`).

### Provider-mismatch trap (CRITICAL)

If a row's `embedding` was previously written by a different provider (e.g. OpenAI text-embedding-3-small) at the same dim (1536), the bytes are valid but the vector space is incompatible. HNSW will silently return wrong neighbors.

**Whenever you switch embedding providers, run `backfill-search-text-and-embeddings.ts --force` over every row that had a prior embedding.** Never trust `embedding IS NOT NULL` as a "skip" signal across provider switches.

### Idempotency keys per table

| Table | Natural key | Notes |
|---|---|---|
| `organization` | `slug` (uniq); `organization_id` is the legacy text PK | Selective update only — never overwrite enriched fields |
| `person` | `slug` (uniq); `person_id` is the legacy text PK | Same; fuzzy-fallback via inspect |
| `library`, `product`, `paper` | `slug` (PK) | Direct upsert |
| `repo` | `slug` (PK) = `<org>-<repo>` | `github_url` also unique |
| `chunk` | `(source_kind, source_id, ord)` and `(source_kind, source_id, content_hash)` both unique | Auto-gen `chunk_id` uuid; never set it |
| Link tables | composite PK (e.g. `(person_id, video_id)`) | Use `.upsert(row, { onConflict: '<comma-sep>' })` |

### Selective update semantics

`upsert-entities.ts` NEVER overwrites a non-null field with another value. It only fills nulls/empties. For full overwrite, run `backfill-search-text-and-embeddings.ts --force` (which is opinionated about which fields to recompute).

### `chunk.source_kind` allowlist

Constrained by `chunk_source_kind_check`. Current allowlist (after migration `20260420000000_add_web_article_chunk_kind.sql`):

```
video_summary, video_transcript_segment, video_description, video_chapter,
session_description,
doc_page, repo_readme, repo_example, repo_doc,
paper_abstract, paper_section,
slide, dossier, report_section, news_item_body, module_body,
web_article, custom
```

If you need a new kind, write a migration extending the constraint (one-line ALTER), then apply it via `pnpm db:push` (if history is in sync) or `scripts/apply-sql.ts` (if not).

### Library/repo/paper use `last_harvested_at`; orgs/people/products/videos use `last_enriched_at`

Watch this column-naming asymmetry when writing new backfill helpers.

### Schema migration history may be out of sync

If `pnpm db:push` complains about "Remote migration versions not found", the user has applied DDL out-of-band. The pragmatic workaround is `pnpm exec tsx scripts/apply-sql.ts <path-to-sql>` to apply the SQL directly via Postgres (`POSTGRES_URL_NON_POOLING`). Each migration file should remain idempotent (`if exists` / `if not exists`).

## Don'ts

- **Don't write to Supabase from `aiwiki/pythonenv/`.** Python is research/transformation only. The graduation lane is TS scripts in `aiengineerapp/scripts/`.
- **Don't re-implement the embedder.** Always import from `lib/retrieval/embedder.ts`.
- **Don't use `.upsert()` without `onConflict`** on tables with composite PKs. The default conflict target is the PK of the table, which is wrong for link tables that have `(a, b)` composite PKs.
- **Don't set `chunk_id` manually.** The column is `uuid default gen_random_uuid()`; passing a sha256 hex string violates the type. Dedup is on `(source_kind, source_id, ord)`.
- **Don't skip `inspect-corpus.ts`.** The gate is there for a reason.

## Pointers

- Skill family: `db-inspect-before-ingest`, `chunk-and-embed`, `entity-extract-and-promote`
- Embedder: [`aiengineerapp/lib/retrieval/embedder.ts`](../../../lib/retrieval/embedder.ts)
- Migrations folder: [`supabase/migrations/`](../../../../supabase/migrations/)
- Real run on CEvIs9y1uog: see `_project.md` artifact blocks for `s04_index`, `s06_entities_in_db`
