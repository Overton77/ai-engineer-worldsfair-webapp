# U0.8 — `assistant_conversation` + `assistant_message` tables

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q12](../06-open-questions.md)
- **Commit prefix:** `[U0.8]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration

## What lands

Two new tables mirroring the Vercel AI SDK message shape. See Q12 in
`../06-open-questions.md` for the full `create table` SQL. Summary:

- `assistant_conversation(conversation_id, user_id, title, model, metadata,
  created_at, updated_at)` — owner-RLS
- `assistant_message(message_id, conversation_id, role, parts jsonb,
  metadata, created_at)` — owner-RLS via join on the parent conversation
- Index `(conversation_id, created_at)`
- CHECK on `role in ('system', 'user', 'assistant', 'tool')`

## Acceptance

- [ ] Owner-RLS enforced at the DB level
- [ ] Parts column accepts the full Vercel AI SDK `Message['parts']`
  shape (text, file, reasoning, tool-call, tool-result, attachment)
- [ ] Citations slot lives under `assistant_message.metadata.citations[]`
- [ ] Types regenerated and committed; amends U6.4 spec

## Working log

- _2026-04-20_ — unit file created.
