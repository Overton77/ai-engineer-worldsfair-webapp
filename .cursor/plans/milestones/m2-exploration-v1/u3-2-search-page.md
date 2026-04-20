# U3.2 — Search page

- **Milestone:** [M2 — Exploration v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U3.2](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — E. Search Page](../../03-wireframes.md)
- **Commit prefix:** `[U3.2]` (lands on milestone branch [`m2-exploration-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U3.1, U1.5

## Acceptance (link to spec)

- [x] `/search?q=…` SSRs the first paint via `searchAll` (Lexical) or
  `matchChunks` (Semantic / Hybrid) per the active mode
- [x] Mode toggle (Lexical / Semantic / Hybrid) re-issues the request and
  swaps the rendered card variant
- [x] URL state (`q`, `mode`, `kinds`) round-trips via `nuqs`
- [x] Kind tabs filter the lexical view by `entity_kind`
- [x] Hybrid mode is the default
- [x] "Ask the AI assistant" CTA toasts as M4 placeholder

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — implemented on `m2-exploration-v1` at `ea58460`.
