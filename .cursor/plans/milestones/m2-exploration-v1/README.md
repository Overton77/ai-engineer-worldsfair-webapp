# M2 — Exploration v1

> **"I can find and read about anything in the AI engineering ecosystem via cmd-K, search, and dossiers."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m2--exploration-v1`](../../05-milestones.md)

- **Branch:** `m2-exploration-v1` (one PR for the whole milestone — see [`git-branch-workflow.mdc`](../../../rules/git-branch-workflow.mdc))
- **Status:** done-on-branch
- **PR:** —

## Units

| Unit | File | Status | Commit |
|---|---|---|---|
| U3.1 | [u3-1-cmd-k.md](./u3-1-cmd-k.md) | done-on-branch | `c0e7858` |
| U3.2 | [u3-2-search-page.md](./u3-2-search-page.md) | done-on-branch | `ea58460` |
| U3.3 | [u3-3-explore-index.md](./u3-3-explore-index.md) | done-on-branch | `71a2923` |
| U3.4 | [u3-4-dossiers-mvp.md](./u3-4-dossiers-mvp.md) | done-on-branch | `c2e4e37` |
| U3.5 | [u3-5-dossiers-secondary.md](./u3-5-dossiers-secondary.md) | done-on-branch | `e2ee7ee` |

### U3.0 prep work (shared scaffolding, not a numbered unit)

| Topic | Commit |
|---|---|
| Deps + UI primitives (cmdk, nuqs, @tanstack/react-query, dialog/tooltip/popover/command) | `39913f3` |
| `explore_<kind>` SQL RPCs (people, orgs, libraries, papers, sessions, videos) — applied via Supabase MCP | `4f33faf` |
| `notes` added to `ENTITY_KINDS` so cross-entity search rows surface | `d48f80c` |
| `lib/search/explore.ts` typed wrapper + tests | `8b53995` |
| `lib/db/dossier.ts` graph readers + tests | `50804c6` |
| `components/explore/*` + `components/dossier/*` shared primitives | `b9f945c` |
| Server/client split for explore wrapper (build fix) | `489ccc6` |

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
