---
name: research-ingestion-workflow
description: Plan and run the AI Engineer YouTube research ingestion workflow with Cursor SDK agents. Use when selecting a video from aiwiki catalogs, creating a research plan, running `research:*` scripts, producing summaries/entities/research packets/module outlines, or ingesting vetted artifacts into Supabase.
---

# Research Ingestion Workflow

Use this skill for the per-video AI Engineer workflow:

1. Select a video from `../aiwiki/ai-intelligence-vault/ai-intelligence/04_catalogs/youtube`.
2. Create or review the mission and execution plan.
3. Run the Cursor SDK workflow script from `aiengineerapp`.
4. Resolve inspection blockers.
5. Ingest only after `db_inspection.md` is clean.

## Source Of Truth

- Runner: `scripts/research-ingestion-workflow.ts`
- Runner modules: `scripts/research-ingestion-workflow/`
- Example config: `scripts/research-ingestion-workflow.example.json`
- Runner docs: `scripts/research-ingestion-workflow/README.md`
- Vault ops: `../aiwiki/.agents/skills/aiwiki-vault-ops/SKILL.md`
- DB inspection: `.cursor/skills/db-inspect-before-ingest/SKILL.md`
- Supabase writes: `.cursor/skills/supabase-writer/SKILL.md`

## Cursor Docs

Consult these before changing orchestration internals:

- Cursor TypeScript SDK: https://cursor.com/docs/sdk/typescript
- Cursor CLI overview: https://cursor.com/docs/cli/overview
- Cursor CLI shell mode: https://cursor.com/docs/cli/shell-mode
- Cursor ACP mode: https://cursor.com/docs/cli/acp

Use the SDK for the workflow runner. Use CLI/PowerShell for manual smoke checks. Treat ACP as a lower-level integration option, not the default runner.

## SDK Pattern

The runner uses `@cursor/sdk` with one fresh local agent per research node:

```ts
const agent = await Agent.create({
  apiKey: process.env.CURSOR_API_KEY!,
  model: { id: process.env.CURSOR_MODEL ?? "composer-2" },
  local: { cwd: process.cwd(), settingSources: [] },
});

try {
  const run = await agent.send(prompt);
  const result = await run.wait();
  // Persist agent.agentId, result.id, result.status, duration, hashes.
} finally {
  await agent[Symbol.asyncDispose]();
}
```

Important SDK rules:

- Always dispose agents with `await agent[Symbol.asyncDispose]()`.
- Always call `run.wait()` even if streaming is not used.
- Distinguish SDK startup errors from run failures.
- Keep agents fresh; pass context through vault files, not long conversations.
- `CURSOR_SDK_SANDBOX=1` requests local sandboxing, but Windows local sandboxing may be unsupported.
- SDK model IDs can differ from CLI display IDs. Use `pnpm run cursor:models` or `Cursor.models.list()` when in doubt.

## Commands

Run from `aiengineerapp/`.

```bash
pnpm run research:doctor -- --video-id <youtube-id>
pnpm run research:plan -- --video-id <youtube-id> --mission "<mission>"
pnpm run research:run -- --video-id <youtube-id> --mission "<mission>" --run-transcript
pnpm run research:resume -- --video-id <youtube-id> --run-dir .runs/research/<run>
```

Useful flags:

- `--skip-ingestion`: continue to optimized summary and module outline without Supabase writes.
- `--apply`: allow ingestion writes. Never use until inspection is clean.
- `--run-smoke-queries`: run retrieval smoke queries after chunks are in Supabase.
- `--run-backfill`: refresh touched entity/video search text and embeddings.
- `--skip-agents`: debug deterministic orchestration without spending Cursor agent calls.

## Standard Flow

1. Run `research:doctor`.
2. Run `research:plan` and confirm bucket, project paths, and DAG nodes.
3. Run `research:run -- --run-transcript` for a fresh video.
4. If ingestion is not desired yet, resume with `--skip-ingestion`.
5. If `db_inspection.md` reports `FUZZY_MATCH`, `NEEDS_REVIEW`, or `ERROR`, fix `entities.json` or the underlying issue. Do not use `--force` to bypass the gate.
6. Re-run inspection.
7. Run ingestion with `--apply`, or run the underlying scripts directly when a narrow repair is safer.
8. Run smoke queries and backfill after chunk ingestion.

## Safety Rules

- Cursor SDK agents produce vault artifacts only.
- Supabase writes stay in `aiengineerapp/scripts/*`.
- `inspect-corpus.ts` must run before entity, link, chunk, or backfill writes.
- Do not force through fuzzy matches. Prefer removing ambiguous entities or canonicalizing them.
- If `arxiv_id` is unknown, ensure paper slugs fall back to title slugs, not an empty string.
- Link-table person rows may need legacy `person.person_id`, not just `person.slug`; use the current scripts rather than hand-writing rows.

## Expected Artifacts

Per-video outputs live at:

`../aiwiki/ai-intelligence-vault/ai-intelligence/01_buckets/<bucket>/videos/<videoId>/`

Important files:

- `transcript.txt`
- `summary.md`
- `entities.json`
- `research/research-plan.json`
- `research/*`
- `summary.optimized.md`
- `module-draft.md`
- `chunks.jsonl`
- `queries/s10_research_workflow.md`

## Closeout

Report:

- The run command and run directory.
- Whether agents ran or were skipped.
- Whether ingestion was skipped, dry-run, or applied.
- Inspection totals.
- Entity/link/chunk/backfill/smoke-query results.
- Any manual entity fixes made before ingestion.
