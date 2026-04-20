# U4.6 — Entity-pinned notes UI

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U4.6](../../04-implementation-units.md)
- **Wireframe rethink:** [`03a-notes-rethink-wireframes.md` — N2 split, §6 invocation matrix](../../03a-notes-rethink-wireframes.md)
  — replaces the dossier "Notes" tab with a hero `[║ Notes]` toggle + count badge driven by `useNotesLayout(entityKind)`
- **Commit prefix:** `[U4.6]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U4.5

## Acceptance (link to spec)

See acceptance list in the spec section.

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — `components/dossier/notes-toggle.tsx` (`[║ Notes]` button + count badge that flips `?notes=split` and remembers the choice via `useNotesLayout`); DossierHero now accepts `notesCount`, `supportsSplit`, `defaultLayout`. Replaced `NotesPlaceholder` with `EntityNotesFooter` (in-page list + "+ New" with optimistic open). All 5 non-video dossier pages (`/p`, `/o`, `/lib`, `/paper`, `/talk`, `/event`) wrapped in `<NotesSplitShell>` and SSR-resolve `getDossierNotesContext` for the count + footer notes. Video gets the marquee `<VideoNotesShell>` in U4.7.
