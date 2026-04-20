# U0.9 — `notification` table + bell badge

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q14](../06-open-questions.md)
- **Commit prefix:** `[U0.9]` (lands on branch [`prereqs`](./README.md))
- **Status:** done-on-branch (`m3-capture-v1`)
- **PR:** —
- **Kind:** schema migration + shell component
- **Note:** folded into the M3 milestone branch so U4.1 follow → notification fires from day one. See [`milestones/m3-capture-v1/README.md`](../milestones/m3-capture-v1/README.md).

## What lands

1. `notification(id, user_id, kind, ref_kind, ref_id, title, body, url,
   read_at, created_at)` — owner-RLS, append-only
2. Bell badge component in the header (`components/shell/header-bell.tsx`),
   Server Component that counts `where user_id = ? and read_at is null`
3. Server Action `markNotificationRead(id | 'all')`

## Acceptance

- [x] Unread count reflects DB state on route change
- [x] Mark-read persists; count updates
- [x] Realtime subscription is optional in v1 (note in the file)

## Working log

- _2026-04-20_ — unit file created.
- _2026-04-20_ — folded into `m3-capture-v1`. Migration `20260420150000_add_notification_table.sql` applied via Supabase MCP; types regenerated. DAL in `lib/db/notifications.ts` with 5 vitest cases. Server action `markNotificationRead`. Header bell split into a server-component shell that fans out to `notifications-bell.client.tsx` (popover + optimistic mark-read).
