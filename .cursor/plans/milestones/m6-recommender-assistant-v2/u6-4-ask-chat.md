# U6.4 — `/ask` full-page chat & history

- **Milestone:** [M6 — Recommender + Assistant v2](./README.md)
- **Spec:** [`04-implementation-units.md` § U6.4](../../04-implementation-units.md)
  — **updated by Q12**: conversations live in dedicated
  `assistant_conversation` + `assistant_message` tables, not co-opted
  `notes`. See [U0.8](../../prereqs/u0-8-assistant-tables.md).
- **Commit prefix:** `[U6.4]` (lands on milestone branch [`m6-recommender-assistant-v2`](./README.md))
- **Status:** not-started
- **PR:** —
- **Depends on:** U6.3, [U0.8](../../prereqs/u0-8-assistant-tables.md)

## Acceptance (link to spec, amended)

- [ ] Sidebar lists past conversations from `assistant_conversation`
- [ ] Resume restores context chips + message history from
  `assistant_message`
- [ ] New turn persists user + assistant messages in the same transaction
- [ ] Citations stored in `assistant_message.metadata.citations[]`

## Working log

- _2026-04-20_ — unit file created; spec amended by Q12 resolution.
