# U0.5 — Flip seed challenge `judge_model` to `gpt-4.1-mini`

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q9](../06-open-questions.md)
- **Commit prefix:** `[U0.5]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** vault edit + re-publish (no schema change)

## What lands

Edit
`aiwiki/ai-intelligence-vault/ai-intelligence/01_buckets/agent_orchestration/course/challenges/skill-mcp-composition-capstone/challenge.md`:

```yaml
judge_model: openai/gpt-4.1-mini   # was anthropic/claude-sonnet-4-5
```

Then re-run
`pnpm exec tsx aiengineerapp/scripts/upsert-challenges.ts --bucket agent_orchestration`.

## Acceptance

- [ ] Vault file updated; commit includes the re-upsert confirmation
- [ ] DB `challenge.judge_model` reflects the new value
- [ ] No migration; no type regen

## Working log

- _2026-04-20_ — unit file created.
