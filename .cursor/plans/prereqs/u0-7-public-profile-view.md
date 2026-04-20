# U0.7 — `public_profile` view

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q11](../06-open-questions.md)
- **Commit prefix:** `[U0.7]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration (view)

## What lands

```sql
create or replace view public.public_profile
with (security_invoker = true) as
  select id, username, display_name, headline, bio, avatar_url,
         expertise_tags, interest_tags, xp_total,
         current_role_title, country, is_public
  from public.profiles
  where is_public = true;
```

Also grant select on the view to `anon, authenticated`. The `/u/[username]`
page queries this view — it never hits `profiles` directly.

## Acceptance

- [ ] View returns rows only when `is_public = true`
- [ ] Notes / saves / attempts / completions never appear in any joined
  response from this view
- [ ] Types regenerated and committed (view will appear under
  `Database["public"]["Views"]`)

## Working log

- _2026-04-20_ — unit file created.
