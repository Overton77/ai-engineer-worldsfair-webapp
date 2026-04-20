# U0.9 — `notification` table + bell badge

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q14](../06-open-questions.md)
- **Commit prefix:** `[U0.9]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration + shell component

## What lands

1. `notification(id, user_id, kind, ref_kind, ref_id, title, body, url,
   read_at, created_at)` — owner-RLS, append-only
2. Bell badge component in the header (`components/shell/header-bell.tsx`),
   Server Component that counts `where user_id = ? and read_at is null`
3. Server Action `markNotificationRead(id | 'all')`

## Acceptance

- [ ] Unread count reflects DB state on route change
- [ ] Mark-read persists; count updates
- [ ] Realtime subscription is optional in v1 (note in the file)

## Working log

- _2026-04-20_ — unit file created.
