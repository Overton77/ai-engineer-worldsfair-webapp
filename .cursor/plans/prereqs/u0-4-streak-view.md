# U0.4 — Streak fn + `current_user_stats` view

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q7](../06-open-questions.md)
- **Commit prefix:** `[U0.4]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** schema migration

## What lands

```sql
create or replace function public.current_streak_days(p_user_id uuid)
returns int language sql stable security invoker set search_path = '' as $$
  -- count contiguous UTC days backwards from today where ≥1 score_event exists
  ...
$$;

create or replace view public.current_user_stats as
  select p.id as user_id, p.xp_total,
         public.current_streak_days(p.id) as streak_days
  from public.profiles p;
```

## Acceptance

- [ ] Function is pure SQL + `stable` + `security invoker` (RLS-safe)
- [ ] View callable via PostgREST; `select * from current_user_stats
  where user_id = ?` returns one row for the caller
- [ ] Perf: <5 ms at 10k score_events per user (explain buffers in the PR)
- [ ] Types regenerated and committed

## Working log

- _2026-04-20_ — unit file created.
