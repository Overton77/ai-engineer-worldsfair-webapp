# U4.5 — Notes workspace screen

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U4.5](../../04-implementation-units.md)
- **Wireframe (superseded):** [`03-wireframes.md` — G. Notes Workspace](../../03-wireframes.md)
- **Wireframe (current):** [`03a-notes-rethink-wireframes.md` — N1 drawer, N2 split, N4 workspace](../../03a-notes-rethink-wireframes.md)
  — scope shifts from a destination workspace to **invocable surfaces** (drawer + split) plus a refined `/notes` index
- **Commit prefix:** `[U4.5]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U4.3, U4.4

## Acceptance (link to spec)

See acceptance list in the spec section.

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — Three notes shells delivered:
  - **N1 NotesQuickDrawer** — mounted at `app/(app)/layout.tsx`, reads `?note=` from `useNoteUrlState`, bootstraps the entire drawer state in one Server Action (`bootstrapDrawerAction`) covering both existing-note and new-note-with-pinTo paths. Promote-to-split routes to the entity dossier with `?notes=split&note=<id>`.
  - **N2 NotesSplitShell** — wraps any dossier body in a `react-resizable-panels` split (60/40, ≥1280px) or vertical stack (smaller); right pane is `<EntityNotesPanel>` which lists pinned notes + mounts the active editor.
  - **N4 `/notes` workspace** + `/notes/[id]` focus mode — refreshed list with FTS search, recent rail, pin-kind filter pills; per-row `[Open ↗]` (default for pinned) routes to dossier with `?notes=split`, `[Editor]` falls back to focus mode.
- URL contract centralised in `lib/notes/use-note-url-state.ts`. `lib/hooks/use-notes-layout.ts` for per-kind localStorage preference.
