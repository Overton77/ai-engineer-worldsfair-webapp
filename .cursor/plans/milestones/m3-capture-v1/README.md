# M3 — Capture v1

> **"I can save, follow, and write notes (freeform & entity-pinned) about anything I explored."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m3--capture-v1`](../../05-milestones.md)

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U4.1 | [u4-1-save-follow.md](./u4-1-save-follow.md) | not-started | — |
| U4.2 | [u4-2-saved-follows-pages.md](./u4-2-saved-follows-pages.md) | not-started | — |
| U4.3 | [u4-3-notes-data.md](./u4-3-notes-data.md) | not-started | — |
| U4.4 | [u4-4-tiptap-editor.md](./u4-4-tiptap-editor.md) | not-started | — |
| U4.5 | [u4-5-notes-workspace.md](./u4-5-notes-workspace.md) | not-started | — |
| U4.6 | [u4-6-entity-pinned-notes.md](./u4-6-entity-pinned-notes.md) | not-started | — |

## Gate to M4

A dogfood user produces ≥ 5 notes and ≥ 10 saves in a session without
confusion.

## Decisions that shape this milestone

- **Q4 / Q5** — `EntityKind` union (shipped via migration
  `20260420140000_expand_user_content_whitelists` and the helper in
  [U0.3](../../prereqs/u0-3-entity-kind-lib.md)). Every save/follow/note
  insert validates against it.
- **Q14** — notification bell ships with follow events in
  [U0.9](../../prereqs/u0-9-notification-table.md); hook it up in U4.1 so
  follows create notifications immediately.
