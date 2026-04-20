---
name: db-inspect-before-ingest
description: Run a DB inspection report against entities.json BEFORE any upsert script touches Supabase. Use whenever ingesting a new video, a batch of news items, a vendor report, or any artifact that produces entities — to dedup against the existing 600+-row corpus and never overwrite human enrichment. Produces aiwiki/.../<bucket>/videos/<video-id>/db_inspection.md which the upsert scripts CONSULT and refuse to bypass.
---

# DB inspect before ingest

## When to run this

Before ANY of these scripts:
- `aiengineerapp/scripts/upsert-entities.ts`
- `aiengineerapp/scripts/upsert-link-tables.ts`
- `aiengineerapp/scripts/upsert-chunks.ts`
- `aiengineerapp/scripts/backfill-search-text-and-embeddings.ts`

The upsert scripts have a hard gate that checks for `db_inspection.md` next to `entities.json` and refuses to run if the report is older than 4 hours OR has unresolved `FUZZY-MATCH` / `NEEDS-REVIEW` / `ERROR` rows.

## Why

The corpus has 600+ existing `youtube_video` rows, plus orgs/people the user has hand-enriched. A naive upsert will:
- duplicate a `person` row when the slug differs (e.g. existing `barry_zhang` vs new `barry-zhang`)
- overwrite hand-edited `categories[]`, `tags[]`, `is_ai_innovator`, `last_enriched_at`
- mismatch FK constraints when slugs don't normalize the same way

The inspect report makes the delta explicit so a human can review before any write happens.

## How to run

```bash
cd aiengineerapp
pnpm exec tsx scripts/inspect-corpus.ts \
  --video-id <video-id> --bucket <bucket-key>
```

Concrete example from this slice (CEvIs9y1uog, agent_orchestration):

```bash
pnpm exec tsx scripts/inspect-corpus.ts \
  --video-id CEvIs9y1uog --bucket agent_orchestration
# -> wrote .../videos/CEvIs9y1uog/db_inspection.md (totals: EXISTS=3 MISSING=13 FUZZY-MATCH=0 NEEDS-REVIEW=0 ERROR=0)
```

## What the report looks like

The report has one section per entity table touched by the slice:

```markdown
## organization  *(2 EXISTS, 2 MISSING)*
- **EXISTS** `anthropic` -- Anthropic
  - id=anthropic embedding=true search_text=1170ch enriched=never (n/a) ai_innovator=false
- **MISSING** `notion` -- Notion
  - would insert as kind=company domain=notion.so (entities.json confidence=0.95)
```

Read the report top-to-bottom before running the upserter.

## Review actions

| Status in report | Meaning | What to do |
|---|---|---|
| `EXISTS` | Slug matches; selective update only | OK, proceed |
| `MISSING` | No row with this slug | OK, will be inserted |
| `FUZZY-MATCH` | Slug missed but full_name fuzzy-hit found existing rows | **Resolve manually**: edit the report and add `# resolved: keep / merge / new-anyway` to the row, then re-run inspect to refresh the report |
| `NEEDS-REVIEW` | Repo slug derived from URL doesn't match the existing row's slug | Inspect manually; usually safe |
| `ERROR` | Query failed or schema mismatch | **Stop**. Fix the underlying issue before any upsert |

## Slug derivation rules (must match across inspect + upsert)

- `person` slug = `lower(name).replace(/[^a-z0-9]+/g, '-').strip('-')` -> `Barry Zhang` becomes `barry-zhang`
- `organization`/`library`/`product`/`paper` slug: from entities.json directly (must already be canonical)
- `repo` slug = `<github_org>-<github_repo>` -> `https://github.com/anthropics/skills` becomes `anthropics-skills`

## Don'ts

- **Don't run the upserters with `--force`** to skip the gate unless you've personally read the report and accepted every annotation.
- **Don't edit `db_inspection.md` to remove FUZZY-MATCH rows** without leaving a `# resolved:` annotation. The next agent reading the file needs to know what you decided.
- **Don't bypass the gate by deleting the file**. The gate exists to keep enrichment intact; bypassing it silently will eventually corrupt rows.

## Pointers

- Script: [`aiengineerapp/scripts/inspect-corpus.ts`](../../../scripts/inspect-corpus.ts)
- Real example output: [`aiwiki/ai-intelligence-vault/ai-intelligence/01_buckets/agent_orchestration/videos/CEvIs9y1uog/db_inspection.md`](../../../../aiwiki/ai-intelligence-vault/ai-intelligence/01_buckets/agent_orchestration/videos/CEvIs9y1uog/db_inspection.md)
- Companion skill: `supabase-writer` (the only place writes happen)
