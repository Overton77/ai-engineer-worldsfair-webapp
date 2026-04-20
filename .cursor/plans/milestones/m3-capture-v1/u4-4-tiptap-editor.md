# U4.4 — Tiptap editor

- **Milestone:** [M3 — Capture v1](./README.md)
- **Spec:** [`04-implementation-units.md` § U4.4](../../04-implementation-units.md)
- **Wireframe rethink:** [`03a-notes-rethink-wireframes.md` §5.1, §5.3](../../03a-notes-rethink-wireframes.md)
  — adds `timestampMention` node + `[⏱]` toolbar + `⌘⇧K` shortcut alongside `entityMention`
- **Commit prefix:** `[U4.4]` (lands on milestone branch [`m3-capture-v1`](./README.md))
- **Status:** done-on-branch
- **PR:** —
- **Depends on:** U4.3, U1.5

## Acceptance (link to spec)

See acceptance list in the spec section.

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — `lib/notes/extensions/{entity-mention,timestamp-mention}.ts`, `components/notes/{note-editor,mention-picker}.tsx` + `note-editor.css`. StarterKit + TaskList + TaskItem + Link + CodeBlockLowlight (highlight.js / lowlight). EntityMention chip links to `ENTITY_HREF[kind]`; TimestampMention chip uses ⏱ MM:SS and exposes `editor.commands.insertTimestamp({videoId, seconds})` plus a ⌘⇧K shortcut that reads `window.__videoNotesCtx__` set by the N3 video shell. Autosave: 500 ms debounce → `autosaveNoteAction`, `beforeunload` flush, optional title derivation when blank. Imperative API: `flush()`, `insertTimestamp()`, `focus()`. Mention picker is a fixed-position list backed by `searchPaletteAction` (fuzzy search across the whole corpus). 2 vitest cases for the timestamp node.
