# U4.7 — Watch+Notes shell for video dossier

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** net-new unit (born from [`03a-notes-rethink-wireframes.md` § N3](../../03a-notes-rethink-wireframes.md))
- **Commit prefix:** `[U4.7]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** not-started
- **PR:** —
- **Depends on:** U4.4 (`timestampMention` node), U4.5 (`NotesSplitShell` + URL contract)

## Goal

Ship `<VideoNotesShell>` so `/video/[id]?notes=split` works end-to-end:
the YouTube player on the left and a tabbed `Notes | Chapters` pane on
the right, with **timestamp citations** as first-class node types that
seek the player on click.

## Included scope

- `components/notes/video-notes-shell.tsx` replacing the layout
  responsibility currently owned by
  [`app/(app)/video/[id]/_video-shell.tsx`](../../../app/(app)/video/[id]/_video-shell.tsx).
- Owns the `<VideoPlayer>` ref + `useQueryState("t")`. Provides
  `VideoNotesContext` to the editor with `seekTo(s)`, `getCurrentTime()`,
  and `videoId`.
- Right pane: shadcn `Tabs` — `Notes | Chapters`. Notes tab mounts the
  shared `<NoteEditor videoCtx=...>`; Chapters tab adds a per-row `[📝]`
  that creates a new note pre-titled with the chapter and prepended
  with a `⏱ <chapter.start>` node.
- Layout variants behind `?notes=` param:
  - `split` (default, after first opt-in) — 60/40 player/notes.
  - `theatre` — notes hidden; floating "Show notes" pill bottom-right.
  - `focus` — player shrinks into a draggable PiP via DOM-portal so
    playback isn't interrupted; notes editor takes full width.
- First-visit nudge banner above the player — dismisses on user action,
  persisted via `useNotesLayout("youtube_video")` →
  `localStorage["aie:notes-layout:youtube_video"]`.

## Excluded scope

- Transcript-selection → quote insertion (depends on M4 chunks).
- Keyboard chapter navigation beyond what the chapter list already
  exposes.
- Persisted `note_cites_video` junction table (revisit in M4).

## Acceptance

- [ ] `?notes=split` renders the split shell on `/video/[id]`.
- [ ] Toolbar `[⏱]` (or `⌘⇧K`) inserts a `timestampMention` node with
      the current player position; rendered chip shows `MM:SS`.
- [ ] Clicking a `⏱ MM:SS` chip in the editor calls
      `playerRef.seekTo(seconds)` and updates `?t=` so the URL stays
      shareable.
- [ ] Per-chapter `[📝]` creates a pinned note with the chapter title
      and a prepended timestamp citation.
- [ ] Theatre mode hides the notes pane and shows a "Show notes" pill;
      Focus mode portals the player into a fixed PiP without restarting
      playback.
- [ ] Layout preference persists across reloads for the same user.

## Working log

- _2026-04-20_ — unit file created from build-plan step 8.
