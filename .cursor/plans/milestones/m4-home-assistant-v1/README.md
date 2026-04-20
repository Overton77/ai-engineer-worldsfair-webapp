# M4 — Personalized Home + Assistant v1

> **"My home feels like mine, and I can ask an AI for grounded answers with citations."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m4--personalized-home--assistant-v1`](../../05-milestones.md)

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U5.1 | [u5-1-personalized-home-rules.md](./u5-1-personalized-home-rules.md) | not-started | — |
| U6.1 | [u6-1-assistant-foundations.md](./u6-1-assistant-foundations.md) | not-started | — |
| U6.2 | [u6-2-assistant-drawer.md](./u6-2-assistant-drawer.md) | not-started | — |
| U9.2 | [u9-2-rate-limits.md](./u9-2-rate-limits.md) | not-started | — |

## Gate to M5

Assistant returns answers with ≥ 1 citation on 95% of in-corpus questions
(manual eval set).

## Decisions that shape this milestone

- **Q6** — news pipeline is internally ingested; U5.1's "New in your
  interests" carousel must empty-state gracefully.
- **Q7** — streak shown in the greeting comes from
  `current_streak_days()` ([U0.4](../../prereqs/u0-4-streak-view.md)).
- **Q1 / embeddings** — assistant retrieval uses `match_chunks` + the
  Cohere embed-v4 embedder at 1536d (already wired in
  `lib/retrieval/embedder.ts`).
