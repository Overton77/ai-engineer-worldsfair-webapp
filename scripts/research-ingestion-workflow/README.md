# Research Ingestion Workflow

This runner is the source of truth for orchestrating Cursor agents over the
AI Engineer video research pipeline.

## Boundary

- Cursor SDK agents produce vault artifacts only.
- Supabase writes stay in `aiengineerapp/scripts/*` ingestion scripts.
- `inspect-corpus.ts` is always run before entity/link/chunk/backfill phases.
- DB writes are dry-run by default and require `--apply`.

## Commands

```bash
pnpm run research:doctor -- --video-id CEvIs9y1uog
pnpm run research:plan -- --video-id CEvIs9y1uog --mission "Produce a grounded course outline."
pnpm run research:run -- --video-id CEvIs9y1uog --skip-agents
pnpm run research:resume -- --run-dir .runs/research/<run>
```

Use `--run-transcript` to fetch captions, `--run-smoke-queries` to query the
live retrieval stack, and `--run-backfill` when the touched slice should
refresh search text and embeddings.

Use `--skip-ingestion` for outline-only passes. This still lets the research
and summary/course nodes run, but it does not inspect/upsert/embed against
Supabase.
