# U3.1 — Global cmd-K palette

- **Milestone:** [M2 — Exploration v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U3.1](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — Global App Shell](../../03-wireframes.md)
- **Commit prefix:** `[U3.1]` (lands on milestone branch [`m2-exploration-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U1.5, U1.3

## Acceptance (link to spec)

- [x] ⌘K / Ctrl+K opens the palette from any `(app)` route
- [x] Debounced (180ms) input wired to `searchPaletteAction` → `searchFuzzy`
- [x] Kind chips toggle the `kinds[]` filter (single-kind toggle in v1)
- [x] Recent searches persisted to `localStorage` (`aie:cmdk:recent`, capped at 8)
- [x] Empty-state copy: "Try searching for talks, libraries, people…"
- [x] Keyboard navigation via cmdk; Enter routes to `ENTITY_HREF[kind](slug ?? id)`
- [x] Save / Note row actions toast as M3 placeholders (no DB writes yet)

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — implemented on `m2-exploration-v1` at `c0e7858`.
