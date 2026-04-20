# U0.6 — `profiles.is_admin` + admin RLS

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q10](../06-open-questions.md)
- **Commit prefix:** `[U0.6]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration + one-shot data edit

## What lands

1. `alter table public.profiles add column is_admin boolean not null default false;`
2. Admin RLS on publish-flow tables:
   - `course_module.status` transition → admin only
   - `course.status` transition → admin only
   - `challenge.status` transition → admin only
   - `course_module_review` insert → admin only
   (Express as `using ((select auth.uid()) in (select id from public.profiles where is_admin))`.)
3. One-shot SQL to set `is_admin = true` on your profile row.
4. Server-side helper `assertAdmin(userId)` in `lib/auth/roles.ts`.

## Acceptance

- [ ] Non-admin user cannot flip a course/module/challenge to `published`
  (RLS rejection)
- [ ] Admin can
- [ ] Scripts running with `SUPABASE_SERVICE_ROLE_KEY` bypass RLS as
  designed (no regression)
- [ ] Types regenerated and committed

## Working log

- _2026-04-20_ — unit file created.
