# U0.10 — Taxonomy constants + synonyms + normalize-tags script

- **Folder:** [prereqs](./README.md)
- **Source:** [`06-open-questions.md` § Q15](../06-open-questions.md)
- **Commit prefix:** `[U0.10]` (lands on branch [`prereqs`](./README.md))
- **Status:** not-started
- **PR:** —
- **Kind:** library files + one-shot script (no migration)

## What lands

1. `aiengineerapp/lib/schema/taxonomy.ts` — exports
   `CATEGORY_KEYS` (26 snake_case) and `DOMAIN_LAYERS` (5) as const
   literal types, plus a `CATEGORY_TO_LAYER` map sourced from
   `aiwiki/docs/03-taxonomy.md`.
2. `aiengineerapp/lib/recommender/tag-synonyms.ts` — free-text → canonical
   map (e.g. `agentic → agent_orchestration`, `ai-agents →
   agent_orchestration`, `evals → evaluations`).
3. `aiengineerapp/scripts/normalize-profile-tags.ts` — one-shot pass that
   rewrites `profiles.interest_tags` and `profiles.expertise_tags` to
   canonical values using the synonyms map. Idempotent, dry-run friendly.

## Acceptance

- [ ] Duplicate of `aiengineerapp/scripts/backfill-video-categories.ts`
  taxonomy map is consolidated against `lib/schema/taxonomy.ts`
- [ ] Script reports rows modified + synonyms matched
- [ ] Server Actions in U2.2 onboarding reject non-canonical tag writes
  (zod refinement)

## Working log

- _2026-04-20_ — unit file created.
