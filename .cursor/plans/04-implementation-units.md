# 04 — Implementation Units

Units are sequenced by **dependency**, not time. Each unit is the smallest
chunk of work that can be PR-reviewed, demoed, and merged on its own. The
challenge unit is intentionally last; recommender and assistant come after the
foundations are stable.

Unit IDs are namespaced by domain (`U1.x` = Foundations, `U2.x` = Identity,
…) so they can be referenced from milestones (doc 05) and tickets.

---

## Group U1 — Foundations & Plumbing

### U1.1 — Project shell & toolchain

- **Goal:** Clean `aiengineerapp` baseline with Tailwind, shadcn/ui,
  Supabase clients (server / browser / service-role), env wiring,
  `database.types.ts` regeneration script, Vitest + Playwright skeleton,
  CI lint+typecheck.
- **Why now:** Every later unit depends on a stable typed shell.
- **Prereqs:** none.
- **Included scope:** `app/layout.tsx` root, `lib/supabase/{server,browser,service}.ts`,
  type-safe env loader (zod), shadcn `init`, base tokens (light/dark), Tailwind
  config, ESLint + Prettier, `pnpm test` working with one trivial test.
- **Excluded scope:** any auth UI, any pages beyond marketing.
- **Risks:** environment / monorepo path quirks; the existing `aiengineerapp`
  has scaffolding we may want to clear or absorb.
- **Acceptance:** `pnpm dev` boots a blank themed shell; `pnpm typecheck` and
  `pnpm test` are green; Supabase server client returns the current user when
  given a session cookie (manual test).
- **Unlocks:** everything.

### U1.2 — Auth & route protection

- **Goal:** Supabase Auth flows (magic link + GitHub OAuth) plus
  middleware that redirects unauthed users to `/login` for `(app)` routes.
- **Why now:** Without authed `userId` in scope, no row can be written.
- **Prereqs:** U1.1.
- **Included scope:** `/login` page, `/auth/callback`, `middleware.ts` with
  matcher for `(app)`, server helpers `getSession()` / `requireUser()`,
  signout action.
- **Excluded scope:** profile screens, onboarding wizard.
- **Risks:** SSR cookie handling differences across runtime/edge.
- **Acceptance:** sign in via magic link → land on `/`; sign out clears
  cookie; visiting `/explore` while logged out lands on `/login`.

### U1.3 — App shell & navigation

- **Goal:** Persistent app chrome (top bar, left rail, right assistant
  drawer placeholder), responsive layout, theme toggle.
- **Why now:** Lets us ship every later page into a finished frame.
- **Prereqs:** U1.2.
- **Included scope:** `app/(app)/layout.tsx`, left-rail nav links (placeholders
  ok for routes not yet built), top bar with cmd-K trigger button, avatar
  menu, theme switch, mobile collapse, sonner toaster mount.
- **Excluded scope:** functional cmd-K (just opens placeholder), assistant
  drawer logic.
- **Risks:** chrome scroll/overflow nuances (especially with the future
  challenge IDE which needs full-bleed).
- **Acceptance:** every authed page renders inside the shell; Lighthouse
  accessibility ≥ 95.

### U1.4 — Domain types & query helpers

- **Goal:** Hand-written `types/domain.ts` (EntityKind union, FilterState
  types), plus `lib/db/<domain>.ts` typed read helpers wrapping
  `supabase.from(...)` for each domain we'll need.
- **Why now:** Centralizes query shapes; all UI units pull from these.
- **Prereqs:** U1.1.
- **Included scope:** `EntityKind`, `EntityRef`, normalized
  `EntitySummary` shape used by cards/cmd-K, helpers like `listPeople()`,
  `getPersonBySlug()`, `listOrgs()`, etc. Helpers compose with filter args.
- **Excluded scope:** writes (those come in their domain unit).
- **Risks:** over-engineering. Ship just what each downstream unit needs.
- **Acceptance:** importable, typed, returns valid Postgrest data; one
  shared `EntitySummary` mapper covers all entity kinds.

### U1.5 — Search infrastructure wrappers

- **Goal:** Typed wrappers around `search_all`, `search_fuzzy`,
  `match_chunks` RPCs with discriminated union outputs and zod schemas.
- **Why now:** Cmd-K, search page, recommender, and assistant all consume
  these.
- **Prereqs:** U1.4.
- **Included scope:** `lib/search/{searchAll,searchFuzzy,matchChunks}.ts`;
  result-shape inference; param sanitization (kinds[], limits).
- **Excluded scope:** UI.
- **Risks:** drift between SQL signature and TS wrapper if RPC changes
  later — mitigated by integration test that runs against a seeded staging.
- **Acceptance:** unit tests with mocked Supabase return typed results;
  manual call against staging returns expected shapes for a known query.

---

## Group U2 — Identity & Personalization

### U2.1 — Profile read/write surface

- **Goal:** `lib/db/profile.ts` with `getProfile(userId)`, `updateProfile()`;
  Server Actions for tag / goal / link mutations; zod schemas.
- **Prereqs:** U1.4.
- **Included scope:** read + partial-update with allowlist; defaults for
  brand-new rows; auto-create on first sign-in via DB trigger or app-level
  upsert. *(Assumption: trigger preferred; doc choice in 06.)*
- **Excluded scope:** UI.
- **Acceptance:** action correctly updates a single row and returns the
  fresh profile; bad input rejected with zod errors.

### U2.2 — Onboarding wizard

- **Goal:** 5-step wizard at `/onboarding/[step]` writing to `profiles`
  on each step; `onboarding_status` advances; final step redirects to `/`.
- **Why now:** Without it, downstream personalization has no signal.
- **Prereqs:** U2.1, U1.3.
- **Included scope:** wizard layout, per-step zod-validated forms (RHF),
  tag chip-picker (interest_tags), home-layer selector (5 visual cards),
  "skip with sensible defaults" link, animated progress dots (framer-motion).
- **Excluded scope:** social-graph follows; recommender activation (that's
  U3.x).
- **Risks:** 26 categories is a lot — must offer "popular first" + search.
- **Acceptance:** new user finishes wizard in ≤ 90s; profile row reflects
  every selection; refresh mid-wizard resumes at correct step;
  `onboarding_status` ends as `'complete'`.

### U2.3 — Profile settings page

- **Goal:** `/settings/profile` and `/settings/account`.
- **Prereqs:** U2.1, U1.3.
- **Included scope:** avatar upload to Supabase Storage with crop, all
  fields editable, visibility toggle, delete-account flow stub.
- **Excluded scope:** linked-account OAuth re-flows (placeholder buttons).
- **Acceptance:** save persists; avatar URL refreshes in shell;
  `is_public` toggles affect `/u/[username]` (built later).

---

## Group U3 — Discovery & Search

### U3.1 — Global cmd-K palette

- **Goal:** Working `⌘K` triggered by top bar; uses `search_fuzzy`
  (debounced) for autocomplete.
- **Prereqs:** U1.5, U1.3.
- **Included scope:** cmdk component, kind chips, keyboard navigation,
  "Open / Save / Note" inline actions, recent searches in localStorage,
  empty state with "Try searching for talks, libraries, people…".
- **Excluded scope:** Save / Note actions actually firing — they no-op
  with a toast until U4.x ships.
- **Risks:** SSR/CSR boundary for the dialog; portal placement; focus
  trapping inside the IDE workspace later.
- **Acceptance:** opens within 50 ms; results stream in ≤ 200 ms p50 on
  staging; arrow keys navigate; enter opens dossier route.

### U3.2 — Search page

- **Goal:** `/search` full UI per wireframe E with hybrid mode toggle.
- **Prereqs:** U3.1, U1.5.
- **Included scope:** server component for first paint (`search_all`),
  client island for facet refinement, nuqs URL state, "ask AI" CTA stub.
- **Excluded scope:** facets that need new SQL (e.g. region histograms);
  v1 uses the universally available filters: kind, tag, has_video.
- **Acceptance:** every kind tab returns sensible counts; hybrid mode
  changes ordering visibly; URL is shareable and restores state.

### U3.3 — Explore index pages

- **Goal:** `/explore/[type]` for the MVP entity types (people, orgs,
  libraries, papers, talks, videos).
- **Prereqs:** U1.4.
- **Included scope:** typed indexes with the wireframe-C filter sidebar,
  per-type sort options, infinite scroll, EntityCard component family.
- **Excluded scope:** product, repo, event, news, report (post-MVP).
- **Acceptance:** every page renders with > 20 results and all filters
  work; SSR p95 < 500 ms.

### U3.4 — Entity dossier (people, orgs, libraries) — MVP set

- **Goal:** `/p/[slug]`, `/o/[slug]`, `/lib/[slug]` per wireframe D.
- **Prereqs:** U3.3.
- **Included scope:** hero, tabs, Overview, Relationships (typed slices
  per entity), "In the corpus" via junction tables, Media via
  `image_attachment`, placeholder Notes tab.
- **Excluded scope:** Save/Follow/Note buttons functional — those wire up
  in U4.
- **Acceptance:** every relationship link clicks through; broken / missing
  data degrades gracefully; SSR with cached data.

### U3.5 — Entity dossier — secondary set

- **Goal:** `/paper/[slug]`, `/talk/[slug]`, `/video/[id]` (with embed +
  chapters), `/event/[slug]`.
- **Prereqs:** U3.4.
- **Included scope:** per the dossier variants in doc 03; YouTube embed +
  deep-linkable timestamps on `/video`.
- **Acceptance:** clicking a chapter jumps the embedded player; talk
  dossier links back to its video and event.

---

## Group U4 — Personal Knowledge

### U4.1 — Save & follow primitives

- **Goal:** Save / unsave / follow / unfollow as Server Actions, plus a
  `useSaveFollow(entityRef)` hook with optimistic state via TanStack Query.
- **Prereqs:** U2.1, U3.4.
- **Included scope:** SaveButton + FollowButton components used everywhere;
  list-existence query batched per page (single round trip per dossier or
  result list).
- **Excluded scope:** "follows-with-news" badge calculation.
- **Acceptance:** click saves instantly with rollback on error; row exists
  in `saved_items` / `profile_followed_entity` with correct
  `entity_type/entity_id`.

### U4.2 — Saved & Follows pages

- **Goal:** `/saved` and `/follows` per wireframe F.
- **Prereqs:** U4.1.
- **Included scope:** type filter, sort, bulk select, remove. Joins
  per-row to fetch fresh subtitles (the row already has denormalized title
  for fast list rendering).
- **Excluded scope:** "what's new since last visit" on `/follows` —
  requires a `last_visited_at` we'd add later.
- **Acceptance:** add via dossier, see appear here; remove via row → gone.

### U4.3 — Notes data layer & freeform notes

- **Goal:** CRUD for `notes` (Server Actions); list endpoint paginated;
  search over `notes.fts`.
- **Prereqs:** U2.1.
- **Included scope:** `lib/db/notes.ts`, types for Tiptap JSON, sanity
  validation on `content_text` derivation, autosave Server Action.
- **Excluded scope:** editor UI.
- **Acceptance:** can create/update/delete via test; `content_text` is
  always derivable from `content_json` server-side (single source of truth).

### U4.4 — Tiptap editor

- **Goal:** Rich-text editor used by the notes workspace, with
  extensions: heading, list, task-list, code-block (shiki), link,
  blockquote, mention.
- **Prereqs:** U4.3, U1.5 (mention picker uses search_fuzzy).
- **Included scope:** Mention extension that resolves to typed entity
  references; markdown export; debounced autosave.
- **Excluded scope:** inline AI ("/" slash menu writing for you) — later.
- **Acceptance:** mention chip renders, links to dossier, persists in
  `content_json`; autosave fires within 500 ms of last keystroke.

### U4.5 — Notes workspace screen

- **Goal:** `/notes` per wireframe G.
- **Prereqs:** U4.3, U4.4.
- **Included scope:** two-pane layout, filters (pinned-to vs freeform),
  search, "+ New" with optional pre-bound entity.
- **Acceptance:** feature-complete per wireframe; works on tablet width.

### U4.6 — Entity-pinned notes UI

- **Goal:** "Notes" tab in every dossier renders & creates notes pinned
  to that entity.
- **Prereqs:** U4.5.
- **Acceptance:** count badge accurate; create from dossier deep-links to
  editor with entity pre-bound.

---

## Group U5 — Personalized Home & Recommender

### U5.1 — Personalized home (rules-based)

- **Goal:** `/` per wireframe B, but recommender is **rule-based** v1:
  - Continue Learning = `course_enrollment` + most-recent `module_completion`
  - New in your interests = `news_item` filtered by `interest_tags ∩ tags`
  - Talks you'd love = `youtube_video` ranked by `popularity_score` filtered
    by `interest_tags`
  - People to follow = `person.expertise_tags ∩ interest_tags`, excluding
    already-followed
- **Prereqs:** U2.x, U3.x, U4.x.
- **Acceptance:** every carousel returns ≥ 3 items for a seeded test
  account; empty states when no signals.

### U5.2 — Interest-vector recommender

- **Goal:** Compute a per-user `interest_embedding` from saves + follows
  + completions; store in `profiles.metadata`; rank candidate entities by
  cosine similarity + tag overlap + freshness.
- **Why this stage:** Needs U4 data flowing in; otherwise the vector is
  meaningless.
- **Prereqs:** U4.x, embedding model decision (see open questions).
- **Included scope:** Inngest job to refresh the vector on save/follow/
  complete events; scoring function in `lib/recommender`; replace v1
  carousels' source with this scorer behind a feature flag.
- **Excluded scope:** collaborative filtering.
- **Risks:** mixed embedding dimensions; cold-start (use rule-based
  fallback for users with < 3 saves).
- **Acceptance:** A/B against rule-based shows higher click-through on
  cards in dogfood.

---

## Group U6 — AI Assistant (cross-cutting)

### U6.1 — Assistant foundations (chat + RAG, no tools)

- **Goal:** `app/api/assistant/route.ts` streaming response using AI SDK +
  `match_chunks` for retrieval.
- **Prereqs:** U1.5.
- **Included scope:** system prompt template, citation extraction, response
  schema with citations array, server-side timeout + abort handling,
  PostHog event for each turn.
- **Excluded scope:** tools, conversation persistence.
- **Acceptance:** Q&A streams to a debug page; citations include
  `chunk_id` + `source_kind` + `source_id` for downstream linking.

### U6.2 — Assistant drawer UI

- **Goal:** Right-rail drawer per wireframe J; context chips; citations
  rendered as inline cards with deep links; "ask current page" auto-injects
  context.
- **Prereqs:** U6.1, U1.3.
- **Acceptance:** opens with `⌘.`; chip from current dossier auto-attached;
  citations open dossiers / videos at timestamp.

### U6.3 — Tool calls (writes)

- **Goal:** Add `searchEntities`, `getEntity`, `searchCorpus`, `saveItem`,
  `followEntity`, `createNote`, `enrollCourse` as AI SDK tools.
- **Prereqs:** U6.2, U4.x (writes), U7.x (enroll).
- **Included scope:** per-tool zod schemas + handlers; UI affordance for
  "AI took action" toasts; per-action audit row in `score_event` only when
  meaningful (e.g. enrolling a course).
- **Acceptance:** asking "save Agenta to my list" results in a row in
  `saved_items`; user can revert.

### U6.4 — `/ask` full-page chat & history

- **Goal:** Multi-turn page; conversations persisted (proposal: store in
  `notes` with a reserved `entity_type='conversation'` until a dedicated
  table is justified).
- **Prereqs:** U6.3.
- **Risks:** stretching `notes` is a deliberate trade-off; flag for review
  if conversation features grow.
- **Acceptance:** sidebar lists past conversations; resume restores
  context chips + history.

---

## Group U7 — Curriculum

### U7.1 — Course & module data layer

- **Goal:** `lib/db/learn.ts` for typed reads of `course`,
  `course_module`, `course_module_in_course` (ordered), `course_module_requires`,
  `module_uses_artifact`. Plus enrollment + completion mutations.
- **Prereqs:** U2.1.
- **Acceptance:** can hydrate a full course with ordered modules and
  prereqs in 1–2 round trips.

### U7.2 — Learn hub & course landing

- **Goal:** `/learn`, `/courses`, `/courses/[slug]` per wireframes H/H1.
- **Prereqs:** U7.1.
- **Included scope:** filter sidebar (layer, bucket, level), "Continue"
  shelf, course landing with syllabus tree showing `pinned_version` chips
  and prereq locks.
- **Excluded scope:** prereq DAG visualizer (later).
- **Acceptance:** enroll button writes `course_enrollment`; resume
  navigates to last-visited module.

### U7.3 — Module reader & mini-quiz

- **Goal:** `/courses/[slug]/m/[moduleSlug]` and `/modules/[slug]` per
  wireframe H2. Mini-quiz scoring writes to `module_completion`.
- **Prereqs:** U7.2, U4.6 (notes pane).
- **Included scope:** markdown rendering with shiki, learning objectives
  panel, sources used (from `module_uses_artifact`), quiz UI, "Mark
  complete" with XP toast (writes `score_event` `kind='module_complete'`).
- **Acceptance:** completion respects "already completed" idempotency; XP
  reflected in left rail without refresh (via TanStack Query invalidation).

### U7.4 — Course progress & resume

- **Goal:** Compute progress % from `module_completion` ∩
  `course_module_in_course`; surface in shell, home, course landing.
- **Prereqs:** U7.3.
- **Acceptance:** progress increments and persists across reload.

---

## Group U8 — Arena (Challenges) — *most complex, last*

### U8.1 — Sandbox provider abstraction (E2B)

- **Goal:** `lib/sandbox/provider.ts` interface + E2B implementation;
  exposes `start, writeFiles, exec, stream, terminate`.
- **Prereqs:** U1.x, infra credentials.
- **Included scope:** local-mock provider for tests; per-attempt sandbox
  lifecycle bound to `attempt.sandbox_session_id`; idle TTL.
- **Risks:** cost + cold starts; needs concurrency caps & rate limits.
- **Acceptance:** can write a Python file, run pytest, capture output,
  terminate — end-to-end against E2B sandbox.

### U8.2 — Challenge data layer & index page

- **Goal:** `/challenges` per wireframe I1; reads `challenge` with filters,
  joins to `course` for capstone label, joins to `attempt` for personal
  best.
- **Prereqs:** U7.1.
- **Acceptance:** every challenge card renders; filters work.

### U8.3 — Challenge attempt workspace (run, no judge)

- **Goal:** `/challenges/[slug]/attempt/[attemptId]` per wireframe I, but
  without the LLM judge yet — just task panel, Monaco editor, sandbox
  exec, terminal stream, tests pass/fail panel.
- **Prereqs:** U8.1, U8.2.
- **Included scope:** create-or-resume attempt route, autosave `code_blob`
  every N seconds, SSE for sandbox events, "Run tests" button populates
  `tests_pass / tests_total`, leave-confirm guard.
- **Excluded scope:** AI tutor, judge, scoring.
- **Acceptance:** run a known-good solution → tests green; refresh mid-edit
  → state restores from `code_blob`.

### U8.4 — Judge + composite scoring + XP

- **Goal:** Wire the LLM judge step on Submit; compute composite_score per
  `attempt.scoring_config`; insert `score_event` and bump XP.
- **Prereqs:** U8.3, U6.1.
- **Included scope:** structured-output judge call (Vercel AI SDK
  `generateObject` with rubric prompt), passing-threshold rule, idempotent
  XP award (one `score_event` per first-pass per challenge), XP toast.
- **Risks:** judge variance / prompt drift — versioned via
  `judge_rubric_version`; log full prompt + response for audit.
- **Acceptance:** submit → both numeric scores → composite within 5s
  median; XP increments; replay of same attempt does not double-award.

### U8.5 — AI Tutor mode (constrained)

- **Goal:** Right-rail tutor inside the attempt workspace; assistant can
  read but not write the code; allowed tools = `searchCorpus`, `getEntity`,
  `getCurrentTaskMd`, `getLastTestOutput`.
- **Prereqs:** U8.3, U6.3.
- **Acceptance:** tutor responses cite chunks; cannot magically pass tests;
  follows safety prompt (no full solutions).

### U8.6 — Capstone wiring & leaderboard

- **Goal:** Course landing surfaces capstone challenge; passing the
  capstone marks the course complete; `/leaderboard` lists top XP.
- **Prereqs:** U8.4, U7.4.
- **Acceptance:** completing capstone updates course progress to 100%;
  leaderboard reflects new XP.

---

## Group U9 — Polish & Operability (interleaved, but tracked)

### U9.1 — Analytics & error monitoring
- PostHog event taxonomy (`onboarding_*`, `entity_view`, `save_*`, `follow_*`,
  `note_*`, `assistant_turn`, `module_complete`, `attempt_*`, `xp_award`),
  Sentry init, source maps. **Adopt:** U2.2 onwards.

### U9.2 — Rate limits & abuse protection
- Upstash rate limit on assistant + sandbox. **Adopt:** before U6.x ships
  to dogfood, before U8 ships at all.

### U9.3 — Background jobs (Inngest)
- Recommender refresh, judge retries, news ingestion fanout.
  **Adopt:** required for U5.2 and U8.4 retries.

### U9.4 — Public profile & shareables
- `/u/[username]` page with bio, XP, public attempts/notes (later).
  **Adopt:** post-U8.

### U9.5 — Tests
- Unit (Vitest) per data helper as it's built.
- Playwright e2e for: onboarding, save+note flow, search, course read,
  challenge submit. **Adopt:** continuously; smoke suite required before
  every milestone close.

---

## Dependency graph (textual)

```
U1.1 ─┬─ U1.2 ── U1.3 ──── all (app) layouts
      ├─ U1.4 ┬─ U2.1 ── U2.2 / U2.3
      │       ├─ U3.3 ── U3.4 ── U3.5
      │       └─ U7.1 ── U7.2 ── U7.3 ── U7.4
      └─ U1.5 ── U3.1 ── U3.2
              └─ U6.1 ── U6.2 ── U6.3 ── U6.4
                                       └── U8.5

U4.1 needs U2.1 + U3.4
U4.2 needs U4.1
U4.3 ── U4.4 ── U4.5 ── U4.6   (U4.4 also needs U1.5)

U5.1 needs U2.x + U3.x + U4.x + U7.x
U5.2 needs U4.x + an embedding decision

U8.1 ── U8.2 ── U8.3 ── U8.4 ── U8.6
                       └── U8.5
```
