# U3.3 — Explore index pages

- **Milestone:** [M2 — Exploration v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U3.3](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — C. Explore (Entity Index)](../../03-wireframes.md)
- **Commit prefix:** `[U3.3]` (lands on milestone branch [`m2-exploration-v1`](./README.md))
- **Status:** not-started
- **PR:** —
- **Depends on:** U1.4

## Acceptance (link to spec) — plus FTS addendum

- [ ] Spec's original acceptance list
- [ ] **Per-entity-type FTS**: `q` URL param filters via
  `where fts @@ websearch_to_tsquery('english', $q)` against the active
  entity table
- [ ] `ts_headline` highlights rendered in result snippet
- [ ] Sort defaults to `ts_rank_cd(...)` when `q` is non-empty
- [ ] Hybrid mode toggle renders **disabled** with "coming soon" tooltip
  (implementation is the phase-2 backlog `match_<entity>` RPC per type)
- [ ] `aria-live="polite"` on result region; `<search>` landmark input

## Working log

- _2026-04-20_ — unit file created; wireframe C updated with the FTS spec.

## Phase-2 backlog (not part of this unit's gate)

- One `match_<entity>` SQL RPC per entity type (RRF over `fts` +
  `embedding`). Same RRF pattern as `match_chunks`. Flip the toggle to
  active once the first RPC ships for one entity type.
