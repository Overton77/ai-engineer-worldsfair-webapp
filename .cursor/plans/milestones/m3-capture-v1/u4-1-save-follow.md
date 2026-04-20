# U4.1 — Save & follow primitives

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U4.1](../../04-implementation-units.md)
- **Commit prefix:** `[U4.1]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U2.1, U3.4, [U0.3](../../prereqs/u0-3-entity-kind-lib.md), [U0.9](../../prereqs/u0-9-notification-table.md) (follow → notification)

## Acceptance (link to spec)

See acceptance list in the spec section.

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — DAL (`lib/db/saves.ts`, `lib/db/follows.ts`, `lib/db/save-follow-state.ts`), server actions (`app/actions/save.ts`, `app/actions/follow.ts`), shared buttons (`components/save-follow/{save,follow,note}-button.tsx`). Replaced placeholder Save/Follow/Note in `dossier-hero.tsx` and `entity-card.tsx`; wired SSR state into all 7 dossier pages (person/org/library/paper/talk/event/video) and the explore first page. Follow inserts a `follow_created` notification so the U0.9 bell increments immediately. 14 vitest cases for the DAL pass.
