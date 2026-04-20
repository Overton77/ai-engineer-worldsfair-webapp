# 06 — Open Questions Requiring Future Validation

These are decisions we deliberately did not resolve in planning. Each should
be answered (and the answer captured here) **before** the unit that depends
on it is started.

Severity legend:
- 🟥 **Blocker** — answer required before the dependent unit can ship.
- 🟧 **High** — wrong answer causes meaningful rework.
- 🟨 **Medium** — affects shape but recoverable.
- 🟩 **Low** — easy to revisit later.
- ✅ **Resolved** — decision recorded inline; downstream units may now reference it.

> **Status (2026-04-20):** All 15 questions resolved in a single pass.
> See "New work surfaced by these resolutions" at the bottom.

---

## Q1 ✅ Embedding model & dimensions
- **Question:** What model populated existing `embedding` columns and
  `chunk.embedding`? What dimension?
- **Why it matters:** All RAG, recommender, and similarity work must use the
  *same* model. Mixing dimensions breaks queries silently.
- **Resolved (2026-04-20):** **`cohere.embed-v4:0`** via Bedrock (env var
  `EMBEDDING_MODEL_COHERE`). All vector columns are `vector(1536)` to match.
  Adapter lives at `aiengineerapp/lib/retrieval/embedder.ts`; query path uses
  the same model so producer/consumer are pinned together. Any new column
  that stores embeddings MUST also be `vector(1536)`. If we ever switch
  models, every embedding column is re-embed in one coordinated pass — do
  not mix dimensions across columns even temporarily.
- **Affects:** U1.5, U5.2, U6.1.

## Q2 ✅ RLS policies
- **Question:** What RLS policies exist today on `profiles`, `notes`,
  `saved_items`, `profile_followed_entity`, `course_enrollment`,
  `module_completion`, `attempt`, `score_event`?
- **Resolved (2026-04-20):** **Implement as RLS policies AND server-side
  auth functions — both layers required.** RLS is the database invariant
  (cannot be bypassed even with a leaked anon key); server-side
  `assertOwner` / `assertRole` is the application invariant (gives clear
  4xx errors and lets us log auth failures). Default pattern for any new
  per-user table:
  1. `alter table … enable row level security;`
  2. `create policy "<table>_modify_own" for all to authenticated using
     ((select auth.uid()) = user_id) with check ((select auth.uid()) =
     user_id);`
  3. Server Action additionally calls `assertOwner(userId)` before the
     insert/update so the API surface returns a 403 instead of an empty
     update.
  Existing migrations already follow this for `profiles`, `notes`,
  `saved_items`, `profile_followed_entity`, `course_enrollment`,
  `module_completion`, `attempt`. `score_event` is owner-RLS read-only;
  writes go through service-role RPCs only.
- **Affects:** every write-path unit (U2.1+, U4.x, U7.x, U8.x).

## Q3 ✅ Auto-create `profiles` row on signup
- **Question:** Is there a DB trigger creating a `profiles` row when a
  Supabase auth user is created? Or do we app-side upsert on first auth?
- **Resolved (2026-04-20):** **No trigger today; one needs to be added.**
  Design: a `handle_new_user()` `security definer` function that inserts a
  minimal `profiles` row (`id = new.id`, `email = new.email`,
  `onboarding_status = 'started'`) and a matching trigger
  `on_auth_user_created after insert on auth.users for each row execute
  procedure public.handle_new_user();`. Function must `set search_path = ''`
  per the existing advisor convention. Apply via the Supabase MCP +
  `apply_migration` (see `.cursor/rules/supabase-migrations.mdc`) and
  commit a matching `.sql` file. Onboarding UI (U2.2) then operates on a
  row that always exists.
- **Affects:** U2.1, U2.2.

## Q4 ✅ Definition of "EntityKind" for polymorphic columns
- **Question:** What exact string values are valid in
  `saved_items.entity_type`, `profile_followed_entity.entity_kind`,
  `notes.entity_type`, `image_attachment.entity_kind`,
  `module_uses_artifact.artifact_kind`?
- **Resolved (2026-04-20):** **The whitelist is the union of every
  entity-bearing table in the schema** — images attach to any entity, and
  users save / follow / take notes on any entity (incl. images
  themselves). Single `EntityKind` union shared across all four
  polymorphic columns:
  ```ts
  // lib/schema/entity-kind.ts
  export const ENTITY_KINDS = [
    'person', 'organization', 'session', 'youtube_video',
    'library', 'product', 'event', 'paper', 'report', 'news_item', 'repo',
    'course', 'course_module', 'challenge', 'attempt', 'image',
  ] as const;
  ```
  `profile_followed_entity` additionally allows `'category'` and
  `'domain_layer'` (faceted follows).
  `module_uses_artifact.artifact_kind` keeps its own narrower whitelist
  (`video / session / dossier / repo / library / product / paper / slide /
  report / news_item / chunk / doc_page / web_article`) — that one is
  about *corpus artifacts*, not user-savable entities.
  Follow-up: `image_attachment.entity_kind` CHECK currently lists only
  the older subset. Widen via the same migration that adds
  `image_attachment` to the saved/notes whitelists (already done for
  saved_items + notes in `20260420140000`; image_attachment widening is a
  small follow-up `apply_migration` call).
- **Affects:** U1.4, U3.4, U4.x, U6.3.

## Q5 ✅ Module/course as a notable "entity" for notes & saves
- **Question:** Should `notes.entity_type='module' / 'course' / 'challenge'`
  be officially supported? Or is the polymorphic surface just for
  knowledge-graph entities?
- **Resolved (2026-04-20):** **Yes, officially supported.** `notes` and
  `saved_items` whitelists were widened in migration
  `20260420140000_expand_user_content_whitelists.sql` to include
  `course`, `course_module`, `challenge`, `attempt`, and `image`.
  `profile_followed_entity` widened in the same migration to include
  `course`, `course_module`, `challenge`. The notes pane in the module
  reader (U4.6) and the "save course / follow challenge" affordances
  (U7.3) are unblocked.
  *Naming nit:* the `notes.entity_type` value is `course_module`
  (snake_case, matches the table name) — not `module`. Codify in
  `lib/schema/entity-kind.ts` (Q4).
- **Affects:** U4.6, U7.3.

## Q6 ✅ News pipeline ownership
- **Question:** Where does `news_item` content come from in production —
  script-seeded? Editor-curated? RSS-ingested?
- **Resolved (2026-04-20):** **Internally ingested for now; no live feed
  yet.** v1 leaves a placeholder that will be filled by a cron / cloud
  job later (target: a scheduled function that hits curated RSS + Tavily
  search + the news section of partner blogs, normalizes to `news_item`
  rows, gated by an importance threshold). UI implication for U5.1: the
  "New in your interests" carousel must degrade gracefully when zero
  matching `news_item` rows exist for the user's `interest_tags`. Show
  an empty state ("we'll surface news here as our curators publish it")
  rather than a broken section. Do not build any editor UI in v1.
- **Affects:** U5.1.

## Q7 ✅ Streak computation
- **Question:** Schema has `xp_total` but no `streak_days` field. Is streak
  derived from `score_event` history at read time, or stored?
- **Resolved (2026-04-20):** **Compute it via a SQL view + RPC. Do not
  store on `profiles`.** Add a SQL function
  `public.current_streak_days(p_user_id uuid)` that derives the streak
  from distinct `(date_trunc('day', created_at at time zone 'utc'))`
  rows in `score_event` where `user_id = p_user_id`, walking backwards
  from today until the first day with no XP. RLS-safe: function is
  `security invoker` so callers only see their own rows. Surface to the
  UI via either:
  (a) a thin Server Action wrapper for the shell rail (U1.3), or
  (b) a `current_user_stats` view that joins `profiles.xp_total +
  current_streak_days(profiles.id)` for the dashboard greeting (U5.1).
  Add caching only if the view shows up in p95 latency once we have
  real load. Apply via Supabase MCP `apply_migration` (commit a matching
  `.sql` file).
- **Affects:** U1.3 (rail), U5.1 (greeting).

## Q8 ✅ Sandbox provider choice & budget
- **Question:** E2B vs Modal vs self-hosted? What is the per-attempt cost
  ceiling?
- **Resolved (2026-04-20):** **Pick one (E2B or Modal — recommend E2B for
  v1; better DX and per-second billing). Initial implementation is
  hard-capped to ONE published challenge** (`skill-mcp-composition-capstone`
  in the `agent_orchestration` bucket) so we can prove the runtime end to
  end before scaling. Concrete guardrails for U8.1:
  1. Server Action validates `challenge.status = 'published'` AND
     `challenge.slug = 'skill-mcp-composition-capstone'` for v1; reject
     anything else with a clear error.
  2. Per-user-per-challenge-per-day attempt cap = **5** (DB check via
     `count(*) on attempt where user_id = ? and challenge_id = ? and
     created_at >= today`). Enforced server-side.
  3. Per-attempt sandbox wall-time cap = **5 minutes**; enforced by the
     sandbox provider config + a server-side timeout that posts a failed
     attempt row if the sandbox is killed.
  4. Per-attempt token budget for the judge call = **15k input + 4k
     output**, hard-stop above that.
  Once these limits hold for one challenge, we widen to N challenges.
- **Affects:** U8.1, U9.2.

## Q9 ✅ Judging model & cost guardrails
- **Question:** Which model do we trust as judge (`challenge.judge_model`)?
  How do we prevent runaway costs on submit-spamming?
- **Resolved (2026-04-20):** **Default judge = `gpt-4.1-mini` OR
  `gemini-2.x-flash`** (whichever has the lower per-1k-tokens at run time;
  both are strong at structured-output for the GEPA rubric and cheap
  enough for the 5-attempts/day cap). Wire both via the Vercel AI SDK so
  switching is a one-line `model: …` change. Stamp the actual model used
  onto the `attempt` row's `metadata.judge_model_used` (separate from
  `challenge.judge_model` which is the *spec*) so re-grading later is
  reproducible.
  Cost guardrails (in addition to Q8 caps):
  - Hard token budget per judge call (15k in / 4k out).
  - Reject submits with `code_blob` length > 200k chars at the API layer
    (anything bigger is almost certainly an attack or a mistake).
  - Per-IP rate limit: 20 submit POSTs / minute via Vercel edge config.
  Update `challenge.judge_model` in the existing seed challenge to
  `openai/gpt-4.1-mini` (currently set to `anthropic/claude-sonnet-4-5`
  in the vault — bring it down).
- **Affects:** U8.4.

## Q10 ✅ Reviewer/curator role
- **Question:** Are there roles beyond the regular user (e.g. `reviewer`,
  `admin`) that gate access to `course_module_review` or course publishing?
- **Resolved (2026-04-20):** **Single admin (you).** No role table in v1;
  no curator UI. Implementation:
  1. Add a `profiles.is_admin boolean not null default false` column (one
     migration via Supabase MCP `apply_migration`; commit matching `.sql`).
  2. Set `is_admin = true` on your own profile row via a one-shot SQL.
  3. Server Actions that publish/review courses or modules call
     `assertAdmin(userId)` which selects `is_admin` from `profiles`. RLS
     additionally restricts publish-flow tables (`course_module_review`,
     status-flip on `course_module`/`course`/`challenge`) to
     `(select auth.uid() in (select id from public.profiles where
     is_admin))`.
  4. All course/module/challenge promotion in v1 runs through the
     existing scripts (`upsert-modules.ts`, etc.) using
     `SUPABASE_SERVICE_ROLE_KEY` — they bypass RLS by design. The admin
     bit + RLS exist so we can add a curator UI later without changing
     the schema again.
- **Affects:** New micro-unit (call it U2.0a: "admin bit migration").
  Out-of-milestone backlog: curator UI.

## Q11 ✅ Public profile contents
- **Question:** When `profiles.is_public=true`, what is visible? XP only?
  Saved items? Notes? Attempts?
- **Resolved (2026-04-20):** **XP + tags + bio.** That's it for v1.
  Specifically: `xp_total`, `expertise_tags`, `interest_tags`, `bio`,
  `headline`, `display_name`, `username`, `avatar_url` (via
  `image_attachment`), `current_role_title`, and the org/country fields
  if set. **Never expose** `notes`, `saved_items`, `attempt`,
  `module_completion`, `score_event` rows on a public profile, even for
  `is_public=true` users — those stay owner-only via RLS. Public-profile
  read uses a dedicated `public_profile` view that selects only the
  whitelisted columns; the view is `security invoker` and inside the
  view the WHERE clause is `where is_public = true`. Followers /
  following count are aggregates over `profile_followed_entity` and are
  fine to expose (count only, not the list).
- **Affects:** U9.4.

## Q12 ✅ Conversation persistence shape
- **Question:** Should AI assistant conversations have a dedicated table,
  or co-opt `notes` with `entity_type='conversation'`?
- **Resolved (2026-04-20):** **Yes, dedicated tables.** The Vercel AI SDK
  does not provide persistence out of the box, and co-opting `notes`
  loses the message-level structure (role / content parts / tool calls /
  attachments) we need for replays, judge audits, and future sharing.
  Mirror the AI SDK message shape:
  ```sql
  create table assistant_conversation (
    conversation_id uuid primary key default gen_random_uuid(),
    user_id         uuid not null references public.profiles(id) on delete cascade,
    title           text,                    -- first user message, abbreviated; updatable
    model           text,                    -- last model used; for display
    metadata        jsonb not null default '{}'::jsonb, -- tool config, system prompt id, filter chips, etc.
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
  );
  create table assistant_message (
    message_id      uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.assistant_conversation(conversation_id) on delete cascade,
    role            text not null check (role in ('system','user','assistant','tool')),
    parts           jsonb not null,          -- ai-sdk Message['parts']: text/file/reasoning/tool-call/tool-result
    metadata        jsonb not null default '{}'::jsonb, -- finish_reason, usage, citations[]
    created_at      timestamptz not null default now()
  );
  create index assistant_message_conversation_idx
    on public.assistant_message (conversation_id, created_at);
  ```
  Both tables are owner-RLS (same pattern as `notes`). Server Action that
  posts a new turn appends to `assistant_message` and updates
  `assistant_conversation.updated_at + title` on the first user turn.
  The retrieval citations the assistant returns get serialized into
  `assistant_message.metadata.citations[]` so the UI can re-render the
  inline source pills without a re-fetch.
  Whitelists from Q4: add `assistant_conversation` and
  `assistant_message` to the `EntityKind` union iff a future feature
  needs to save / note them; not v1.
- **Affects:** U6.4 (rewrite from "co-opt notes" to "dedicated tables").

## Q13 ✅ i18n
- **Question:** Will the app ship i18n in any near-term horizon?
- **Resolved (2026-04-20):** **No, not right now.** English-only v1.
  Component pattern: write user-facing strings as plain literals (don't
  wrap in a `t()` helper yet). When i18n becomes a near-term concern, a
  `next-intl` migration is a one-time sweep — premature wrapping would
  add ceremony for no current benefit.
- **Affects:** Component patterns only.

## Q14 ✅ Notification surfaces
- **Question:** Do follows produce in-app only, or also email digests?
- **Resolved (2026-04-20):** **In-app + bell badge in v1.** No email
  digests. Concrete shape:
  - New table `notification (id, user_id, kind, ref_kind, ref_id,
    title, body, url, read_at, created_at)` (owner-RLS, append-only).
  - A header bell icon shows unread count via a Server Component query
    (`count(*) where user_id = ? and read_at is null`) refreshed on
    route change; Realtime subscription optional in v1.
  - Marking-read = a Server Action that sets `read_at = now()` for the
    one row (or all rows on "mark all read").
  - Producers: follow-graph events ("X published a new module in
    `agent_orchestration`"), course-progress milestones (e.g. course
    completed), challenge graded.
  Email digests are a backlog item post-M8.
- **Affects:** U4.2, backlog.

## Q15 ✅ Tag canonicalization
- **Question:** `interest_tags`, `expertise_tags`, `entity.tags`, etc. are
  free-text `text[]`. Is there a canonical vocabulary? Do we need a
  controlled list / synonyms layer for matchmaking?
- **Resolved (2026-04-20):** **No free-text — use a controlled
  vocabulary.** Two-layer canonical list:
  1. **Bucket tags** (the 26-key taxonomy from
     `aiwiki/docs/03-taxonomy.md`, e.g. `agent_orchestration`,
     `evaluations`, …). Snake_case; matches `youtube_video.category`.
  2. **Layer tags** (the 5-layer meta-stack: `intelligence`, `agents`,
     `systems`, `application`, `governance`).
  Implementation:
  - Source the canonical list from a single
    `lib/schema/taxonomy.ts` constants file (TS literal types) + a
    matching `aiwiki/starter_content/derived_taxonomy.md` checksum so
    the two never drift.
  - `profiles.interest_tags` and `profiles.expertise_tags` are
    constrained at the *Server Action* layer to elements of that union
    (DB stays `text[]` — no CHECK constraint, easier to extend the
    taxonomy without a migration).
  - Onboarding tag picker is a multi-select chip UI sourced from the
    same constants — users cannot type free-text tags.
  - Existing free-text values from prior writes get normalized in a
    one-shot `aiengineerapp/scripts/normalize-profile-tags.ts` pass
    (synonyms map in `lib/recommender/tag-synonyms.ts`: e.g.
    `agentic → agent_orchestration`, `ai-agents → agent_orchestration`,
    `evals → evaluations`).
  - `entity.tags` (on `library`, `product`, etc.) stays free-text for
    now — those are author-provided, not user-provided, and the
    recommender uses the canonical `category` / `domain_layer` columns
    instead.
- **Affects:** U2.2 (onboarding chip picker), U5.x (recommender).

---

## New work surfaced by these resolutions

The 15 resolutions above introduce concrete schema/code work that was not
in the original unit list. Capture each as a small unit before sealing M0:

| ID | Source | What | Where it lands |
|---|---|---|---|
| **U0.1** | Q3 | Add `handle_new_user()` + `on_auth_user_created` trigger; commits `.sql` file. | New migration via Supabase MCP `apply_migration` |
| **U0.2** | Q4 | Widen `image_attachment.entity_kind` CHECK to the full `EntityKind` union. | New migration via MCP |
| **U0.3** | Q4, Q5 | Single source of truth `lib/schema/entity-kind.ts` shared by every polymorphic insert path; co-located zod schema. | New file in `aiengineerapp/lib/schema/` |
| **U0.4** | Q7 | `current_streak_days(p_user_id)` SQL function + `current_user_stats` view. | New migration via MCP |
| **U0.5** | Q9 | Update vault `challenge.judge_model` for `skill-mcp-composition-capstone` from `anthropic/claude-sonnet-4-5` → `openai/gpt-4.1-mini`; re-run `upsert-challenges.ts`. | Vault edit + script |
| **U0.6** | Q10 | `profiles.is_admin` column + admin RLS for course/module/challenge publish-flow tables; one-shot SQL to grant your user. | New migration via MCP |
| **U0.7** | Q11 | `public_profile` view (`security invoker`, whitelisted columns only). | New migration via MCP |
| **U0.8** | Q12 | `assistant_conversation` + `assistant_message` tables, owner-RLS, indexed on `(conversation_id, created_at)`. | New migration via MCP; replaces co-opt-`notes` plan in U6.4 |
| **U0.9** | Q14 | `notification` table + bell badge component. | New migration via MCP + new shell component |
| **U0.10** | Q15 | `lib/schema/taxonomy.ts` (constants) + `lib/recommender/tag-synonyms.ts` + `aiengineerapp/scripts/normalize-profile-tags.ts`. | New library files + one-shot script |

Each of U0.1 / U0.2 / U0.4 / U0.6 / U0.7 / U0.8 / U0.9 must follow
`.cursor/rules/supabase-migrations.mdc`: apply via Supabase MCP
`apply_migration` AND commit a matching idempotent `.sql` file under
`supabase/migrations/`, then `pnpm db:types` and commit the regenerated
`types/database.types.ts` in the same change.

After landing U0.x, fold the affected acceptance criteria into the
matching unit in `04-implementation-units.md` (notably U2.0a/b for the
admin bit, U6.4 rewrite for the dedicated conversation tables, and U4.6
to cite the new whitelists).

---

## Process for resolving these

1. Before kicking off any unit, scan this doc and resolve any 🟥/🟧
   questions it depends on.
2. When resolved, edit the question in place: change the severity emoji to
   ✅ and append a short "Resolved: <decision>, <date>".
3. If a resolution invalidates an earlier doc (00–05), update that doc and
   note the change in the matching unit acceptance criteria.
