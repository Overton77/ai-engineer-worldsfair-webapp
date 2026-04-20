# M3 — Capture v1

> **"I can save, follow, and write notes (freeform & entity-pinned) about anything I explored."**
>
> Canonical sequencing + gate: [`../../05-milestones.md#m3--capture-v1`](../../05-milestones.md)

- **Branch:** `m3-capture-v1` (one PR for the whole milestone — see [`git-branch-workflow.mdc`](../../../rules/git-branch-workflow.mdc))
- **Status:** not-started
- **PR:** —

## Units

| Unit | File | Status | PR |
|---|---|---|---|
| U0.9 | [../../prereqs/u0-9-notification-table.md](../../prereqs/u0-9-notification-table.md) | done-on-branch | — |
| U4.1 | [u4-1-save-follow.md](./u4-1-save-follow.md) | done-on-branch | — |
| U4.2 | [u4-2-saved-follows-pages.md](./u4-2-saved-follows-pages.md) | done-on-branch | — |
| U4.3 | [u4-3-notes-data.md](./u4-3-notes-data.md) | done-on-branch | — |
| U4.4 | [u4-4-tiptap-editor.md](./u4-4-tiptap-editor.md) | done-on-branch | — |
| U4.5 | [u4-5-notes-workspace.md](./u4-5-notes-workspace.md) | in-progress | — |
| U4.6 | [u4-6-entity-pinned-notes.md](./u4-6-entity-pinned-notes.md) | not-started | — |
| U4.7 | [u4-7-watch-notes.md](./u4-7-watch-notes.md) | not-started | — |

> **U0.9 is folded into this branch** (per build-plan decision 2026-04-20).
> The notification table + bell badge ship as the first commit group on
> `m3-capture-v1` so U4.1 can fire `follow_created` notifications from
> day one. The U0.9 unit file lives under `prereqs/` for canonical
> tracking but its commits land here.

## Gate to M4

A dogfood user produces ≥ 5 notes and ≥ 10 saves in a session without
confusion.

## Wireframe rethink (read first)

The notes UX for M3 has been re-imagined in
[`../../03a-notes-rethink-wireframes.md`](../../03a-notes-rethink-wireframes.md).
That doc supersedes §D's "Notes" tab and §G's "Notes Workspace" in
[`../../03-wireframes.md`](../../03-wireframes.md). Read 03a before
breaking ground on U4.3–U4.6 — it changes the *shape* of U4.5/U4.6
(invocable surfaces, not destination screens) and proposes a net-new
**U4.7 Watch+Notes shell** for the video dossier.

## Decisions that shape this milestone

- **Q4 / Q5** — `EntityKind` union (shipped via migration
  `20260420140000_expand_user_content_whitelists` and the helper in
  [U0.3](../../prereqs/u0-3-entity-kind-lib.md)). Every save/follow/note
  insert validates against it.
- **Q14** — notification bell ships with follow events in
  [U0.9](../../prereqs/u0-9-notification-table.md); hook it up in U4.1 so
  follows create notifications immediately.
