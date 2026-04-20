# U0.1 — `handle_new_user()` trigger

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q3](../06-open-questions.md)
- **Commit prefix:** `[U0.1]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration (apply via Supabase MCP; commit matching `.sql`)

## What lands

A `security definer` function `public.handle_new_user()` + trigger
`on_auth_user_created` on `auth.users` that inserts a minimal `profiles`
row (`id = new.id`, `email = new.email`, `onboarding_status = 'started'`).
Function sets `search_path = ''` per the existing advisor convention.

## Acceptance

- [ ] New Supabase user → `profiles` row auto-created within the same
  transaction
- [ ] Function passes Supabase advisor `function_search_path_mutable`
- [ ] Idempotent re-run (the migration uses `create or replace` +
  `drop trigger if exists` / `create trigger`)
- [ ] Types regenerated and committed

## Working log

- _2026-04-20_ — unit file created.
