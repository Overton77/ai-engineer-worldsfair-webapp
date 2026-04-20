# M7 — Arena v1

> **"I can take a coding challenge, run it in a sandbox, get tests + LLM judging, and earn XP."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m7--arena-v1`](../../05-milestones.md)

- **Branch:** `m7-arena-v1` (one PR for the whole milestone — see [`git-branch-workflow.mdc`](../../../rules/git-branch-workflow.mdc))
- **Status:** not-started
- **PR:** —

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U8.1 | [u8-1-sandbox-provider.md](./u8-1-sandbox-provider.md) | not-started | — |
| U8.2 | [u8-2-challenge-index.md](./u8-2-challenge-index.md) | not-started | — |
| U8.3 | [u8-3-attempt-workspace.md](./u8-3-attempt-workspace.md) | not-started | — |
| U8.4 | [u8-4-judge-scoring.md](./u8-4-judge-scoring.md) | not-started | — |
| U8.5 | [u8-5-ai-tutor.md](./u8-5-ai-tutor.md) | not-started | — |

## Gate to M8

Judge variance < 10% across 5 reruns of the same correct solution on a
calibration challenge; sandbox cold-start p95 < 8 s.

## Decisions that shape this milestone

- **Q8** — v1 is **hard-capped to one published challenge**
  (`skill-mcp-composition-capstone`). U8.2 server-side rejects every
  other slug. Widen to N only after the runtime proves out for the one.
- **Q8** — per-user-per-challenge-per-day attempt cap = 5; sandbox
  wall-time cap = 5 min; judge token budget = 15k in / 4k out.
- **Q9** — default `challenge.judge_model = openai/gpt-4.1-mini`. The
  vault-side challenge spec still says `claude-sonnet-4-5` — flip via
  [U0.5](../../prereqs/u0-5-judge-model-swap.md) and re-run
  `upsert-challenges.ts` before U8.4 ships to dogfood.
- **Q2** — `attempt` rows are owner-RLS; `score_event` writes go through
  service-role RPC so the judge-bot cannot be impersonated by the user.
