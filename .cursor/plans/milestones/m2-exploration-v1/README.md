# M2 — Exploration v1

> **"I can find and read about anything in the AI engineering ecosystem via cmd-K, search, and dossiers."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m2--exploration-v1`](../../05-milestones.md)

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U3.1 | [u3-1-cmd-k.md](./u3-1-cmd-k.md) | not-started | — |
| U3.2 | [u3-2-search-page.md](./u3-2-search-page.md) | not-started | — |
| U3.3 | [u3-3-explore-index.md](./u3-3-explore-index.md) | not-started | — |
| U3.4 | [u3-4-dossiers-mvp.md](./u3-4-dossiers-mvp.md) | not-started | — |
| U3.5 | [u3-5-dossiers-secondary.md](./u3-5-dossiers-secondary.md) | not-started | — |

## Gate to M3

Every dossier loads SSR p95 < 700 ms; every relationship chip is clickable
and lands somewhere; cmd-K returns results in < 200 ms.

## Decisions that shape this milestone

- **Wireframe C update (2026-04-20)** — Explore index now ships with
  **per-entity-type FTS** powered by each table's generated `fts` column,
  `ts_rank_cd` ranking, `ts_headline` snippets. See
  [`../../03-wireframes.md#c-explore-entity-index`](../../03-wireframes.md).
  Hybrid mode (RRF over `fts` + embedding) is phase-2; the toggle ships
  disabled in v1.
- **Phase-2 hybrid match RPCs** (one `match_<entity>` RPC per type) are a
  new backlog item — not part of M2's gate, but U3.3 must land the UI
  toggle in a disabled state so enabling it later is a one-line wire-up.
