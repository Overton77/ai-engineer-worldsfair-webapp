# U0.2 — Widen `image_attachment.entity_kind` whitelist

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q4](../06-open-questions.md)
- **Commit prefix:** `[U0.2]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration

## What lands

`alter constraint` on `image_attachment.entity_kind` to match the full
`EntityKind` union defined in [U0.3](./u0-3-entity-kind-lib.md). Current
list is narrower than the saved/notes whitelist and blocks attaching
images to some supported entity kinds.

## Acceptance

- [ ] Whitelist matches the shared `EntityKind` union verbatim
- [ ] Idempotent (`drop constraint if exists` + `add constraint`)
- [ ] Types regenerated and committed

## Working log

- _2026-04-20_ — unit file created.
