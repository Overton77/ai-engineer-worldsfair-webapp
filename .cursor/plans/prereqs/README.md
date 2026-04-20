# Prereqs (U0.x) — Surfaced from Q1–Q15 resolutions

The 2026-04-20 pass through [`../06-open-questions.md`](../06-open-questions.md)
resolved every question and surfaced 10 small migration / library / script
units. **M0's gate assumes they've landed first** (or are landing
concurrently — the only hard ordering is that U0.3 / U0.10 need to exist
before U1.4 imports from them).

- **Branch:** `prereqs` (one PR for the whole group — see [`git-branch-workflow.mdc`](../../rules/git-branch-workflow.mdc))
- **Status:** not-started
- **PR:** —

Per the [git workflow rule](../../rules/git-branch-workflow.mdc), all 10
units land as commits with `[U0.X]` prefixes on the single `prereqs`
branch, then merge to `main` with a merge commit (not squash) so the
per-unit history survives.

## Units

| Unit | File | Source | What it lands | Status | PR |
|---|---|---|---|---|---|
| U0.1 | [u0-1-auth-trigger.md](./u0-1-auth-trigger.md) | Q3 | `handle_new_user()` + `on_auth_user_created` trigger | not-started | — |
| U0.2 | [u0-2-image-attachment-whitelist.md](./u0-2-image-attachment-whitelist.md) | Q4 | Widen `image_attachment.entity_kind` whitelist to full `EntityKind` | not-started | — |
| U0.3 | [u0-3-entity-kind-lib.md](./u0-3-entity-kind-lib.md) | Q4 / Q5 | `lib/schema/entity-kind.ts` + zod schema | not-started | — |
| U0.4 | [u0-4-streak-view.md](./u0-4-streak-view.md) | Q7 | `current_streak_days(uuid)` fn + `current_user_stats` view | not-started | — |
| U0.5 | [u0-5-judge-model-swap.md](./u0-5-judge-model-swap.md) | Q9 | Flip seed `challenge.judge_model` → `openai/gpt-4.1-mini` | not-started | — |
| U0.6 | [u0-6-admin-bit.md](./u0-6-admin-bit.md) | Q10 | `profiles.is_admin` column + admin RLS on publish-flow tables | not-started | — |
| U0.7 | [u0-7-public-profile-view.md](./u0-7-public-profile-view.md) | Q11 | `public_profile` view (whitelisted columns, `security invoker`) | not-started | — |
| U0.8 | [u0-8-assistant-tables.md](./u0-8-assistant-tables.md) | Q12 | `assistant_conversation` + `assistant_message` tables | not-started | — |
| U0.9 | [u0-9-notification-table.md](./u0-9-notification-table.md) | Q14 | `notification` table + bell badge component | not-started | — |
| U0.10 | [u0-10-taxonomy-constants.md](./u0-10-taxonomy-constants.md) | Q15 | `lib/schema/taxonomy.ts` + synonyms map + `normalize-profile-tags.ts` | not-started | — |

## Migration discipline

Every U0.x migration unit MUST follow
[`../../rules/supabase-migrations.mdc`](../../rules/supabase-migrations.mdc):

1. Apply via Supabase MCP `apply_migration` (not `pnpm db:push`).
2. Commit a matching idempotent `.sql` file under `supabase/migrations/`
   with a round-timestamp name (e.g. `20260421120000_<snake>.sql`).
3. Run `pnpm db:types` and commit the regenerated
   `aiengineerapp/types/database.types.ts` in the same PR.
4. Leave remote-only migration timestamps alone; never run
   `supabase migration repair --status reverted`.
