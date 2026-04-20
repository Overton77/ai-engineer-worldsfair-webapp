# U4.3 — Notes data layer & freeform notes

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U4.3](../../04-implementation-units.md)
- **Wireframe rethink:** [`03a-notes-rethink-wireframes.md` §5.1, §8](../../03a-notes-rethink-wireframes.md)
  — adds `listNotesForEntity` + `entityMention` / `timestampMention` aware `content_text` derivation
- **Commit prefix:** `[U4.3]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U2.1, [U0.3](../../prereqs/u0-3-entity-kind-lib.md)

## Acceptance (link to spec)

See acceptance list in the spec section.

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — `lib/notes/types.ts` (loose Zod for the TipTap doc, mention attrs schemas, `NoteSummary` + `asNoteSummary`); `lib/notes/derive-text.ts` (entity/timestamp-mention aware, `formatTimestamp` MM:SS / H:MM:SS); `lib/db/notes.ts` (CRUD + listForUser FTS + listForEntity + countForEntity + listRecentlyEdited + createEmptyNote); `app/actions/notes.ts` (createNoteAction, autosaveNoteAction, deleteNoteAction, listNotesForEntityAction). 17 vitest cases pass.
