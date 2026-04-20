# U3.3 — Explore index pages

- **Milestone:** [M2 — Exploration v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U3.3](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — C. Explore (Entity Index)](../../03-wireframes.md)
- **Commit prefix:** `[U3.3]` (lands on milestone branch [`m2-exploration-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U1.4

## Acceptance (link to spec) — plus FTS addendum

- [x] `/explore/[type]` for the MVP entity types (people, orgs, libraries,
  papers, sessions, youtube_videos)
- [x] **Per-entity-type FTS**: `q` URL param filters via
  `where fts @@ websearch_to_tsquery('english', $q)` against the active
  entity table (each `explore_<kind>` RPC)
- [x] `ts_headline` highlights rendered in result snippet (preserved
  through the sanitiser to keep `<mark>` wrappers)
- [x] Sort defaults to `ts_rank_cd(...)` when `q` is non-empty (page-level
  default; user can override via the Sort dropdown)
- [x] Hybrid mode toggle renders **disabled** with "coming soon" tooltip
- [x] `aria-live="polite"` on result region; `<search>` landmark input
- [x] Filter sidebar (Layer, Category, Tags) wired via `nuqs` URL state;
  unsupported filters render greyed-out per kind
- [x] Bare `/explore` redirects to `/explore/person`
- [x] Switching tabs preserves the active query string

## Working log

- _2026-04-20_ — unit file created; wireframe C updated with the FTS spec.
- _2026-04-20_ — implemented on `m2-exploration-v1` at `71a2923`.

## Phase-2 backlog (not part of this unit's gate)

- One `match_<entity>` SQL RPC per entity type (RRF over `fts` +
  `embedding`). Same RRF pattern as `match_chunks`. Flip the toggle to
  active once the first RPC ships for one entity type.
