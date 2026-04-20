# U4.2 — Saved & Follows pages

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U4.2](../../04-implementation-units.md)
- **Wireframe:** [`03-wireframes.md` — F. Saved & Follows](../../03-wireframes.md)
- **Commit prefix:** `[U4.2]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U4.1

## Acceptance (link to spec)

See acceptance list in the spec section.

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — `/saved` and `/follows` ship with type-filter pills, sort, bulk select & remove, optimistic per-row remove + Note button. `/follows` resolves entity titles via the new `lib/db/resolve-entity-summary.ts` (one query per kind). Synthetic kinds (category, domain_layer) link to filtered explore views. "What's new since last visit" stays out of scope.
