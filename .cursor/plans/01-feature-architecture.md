# 01 — Product Domains & Feature Architecture

The app is decomposed into **seven product domains**. Each domain owns a slice
of the schema, a set of screens, and a clear contract with neighbors.

```
┌────────────────────────── Identity & Personalization ──────────────────────────┐
│         Onboarding ──► Profile ──► Personal Signals (tags, goals, layer)        │
└──────────────────────────────────┬─────────────────────────────────────────────┘
                                   │ feeds personalization to all of:
        ┌──────────────────┬───────┴────────┬────────────────┬──────────────────┐
        ▼                  ▼                ▼                ▼                  ▼
   Discovery         Knowledge          Personal         Curriculum          Arena
   & Search          Graph              Knowledge        (Courses +          (Challenges +
   (cmd-K, feed,     (entities,         (notes, saves,   Modules +           Sandboxes +
    recs, news)      relationships)     follows)         Reviews)            Scoring/XP)
                                   │
                                   ▼
                          AI Assistant (cross-cutting)
                          uses match_chunks + tools into every domain
```

A separate, **cross-cutting** layer:

- **AI Assistant** — RAG-grounded chat over the corpus, with tool access into
  saves/notes/follows/courses.

## Domain summary

| # | Domain | Schema surface |
|---|---|---|
| D1 | Identity & Personalization | `profiles`, `auth.users` |
| D2 | Knowledge Graph (Entities) | `person`, `organization`, `library`, `paper`, `product`, `repo`, `youtube_video`, `youtube_channel`, `session`, `event`, `news_item`, `report`, `image`, `image_attachment`, all `*_appeared_in_*` and `*_authored_by` tables |
| D3 | Discovery, Search & Recommendations | `search_all`, `search_fuzzy`, `match_chunks`, `chunk` + read-only views over D2 + recommender logic over `profiles` × entities |
| D4 | Personal Knowledge (Notes/Saves/Follows) | `notes`, `saved_items`, `profile_followed_entity` |
| D5 | Curriculum (Courses & Modules) | `course`, `course_module`, `course_module_in_course`, `course_module_requires`, `course_module_review`, `module_uses_artifact`, `course_enrollment`, `module_completion` |
| D6 | Arena (Challenges & Scoring) | `challenge`, `attempt`, `score_event`, `profiles.xp_total` |
| D7 | AI Assistant (cross-cutting) | `chunk`, `match_chunks`, plus tool calls into D3/D4/D5/D6 |

---

## D1 — Identity & Personalization

**Purpose.** Capture who the user is well enough to drive every recommendation,
default filter, and curriculum decision throughout the app.

**Schema reads/writes.** `profiles.{username, display_name, avatar_url, bio,
headline, country, location, timezone, current_org_id, current_role_title,
experience_level, expertise_tags[], interest_tags[], goals[], home_layer,
linked_accounts, onboarding_status, is_public}`.

**Key user actions.**
- Sign up (Supabase Auth — magic link, OAuth GitHub/Google)
- Complete a 4-step onboarding wizard
- Edit profile (avatar, bio, tags, goals, social links)
- Toggle profile visibility
- Choose / change "home layer" (L1–L5)
- Disconnect / reconnect linked accounts

**Major screens.**
- `/login` — email + OAuth providers
- `/onboarding/[step]` — multi-step wizard (Welcome → Identity → Interests → Goals → Home Layer → Done)
- `/profile` — public profile (when `is_public=true`)
- `/settings/profile` — private edit form
- `/settings/account` — auth, linked accounts, danger zone

**Dependencies.** None. Foundation for all others.

**MVP vs later.**
- MVP: auth, onboarding wizard, basic profile edit, `home_layer` selection.
- Later: profile portfolio (link to public attempts/notes), social graph
  (follow other users), public profile pages with stats.

---

## D2 — Knowledge Graph (Entity Exploration)

**Purpose.** Make every entity in the AI engineering ecosystem first-class:
browseable, linkable, relateable.

**Schema reads.** All entity tables; all junction tables for "Related" panels.

**Key user actions.**
- Browse a paginated list of any entity type, with filter chips
- Open an entity dossier
- Pivot through relationships ("People who work at this org", "Talks where
  this library appears")
- See attached media (`image_attachment`) and external links
- Save / unsave / follow the entity (calls into D4)
- Add a note about the entity (calls into D4)
- Ask the assistant about it (calls into D7, pre-filtered)

**Major screens.**
- `/explore` — entity-type tabs + global filters
- `/explore/people`, `/orgs`, `/libraries`, `/papers`, `/products`, `/repos`,
  `/talks`, `/events`, `/videos`, `/news`, `/reports` — typed indexes, each
  with filter sidebar (tags, region, year, layer, etc.) and a results grid
- `/p/[slug]` (person dossier), `/o/[slug]` (org), `/lib/[slug]`, `/paper/[slug]`,
  `/product/[slug]`, `/repo/[slug]`, `/talk/[slug]`, `/event/[slug]`,
  `/video/[id]`, `/news/[slug]`, `/report/[slug]`

**Dossier anatomy (per entity).**
1. Hero (name, tagline, hero image, primary CTAs: Save / Follow / Note / Ask)
2. Identity strip (location, role, links, key counts)
3. Tabs:
   - Overview (markdown body / summary)
   - Relationships (typed graph slices: Works at, Founded, Sponsored, Appears in)
   - Mentions in Corpus (videos, papers, sessions, news; with snippet & timestamp)
   - Media (images, attached assets)
   - Notes (the user's notes pinned to this entity)
   - Activity (recent news, recent talks)

**Dependencies.** D1 (for save/follow attribution).

**MVP vs later.**
- MVP: index + dossier for the **6 most-used types**: person, org, library,
  video, talk, paper. Static "Related" panels driven by junction tables.
- Later: product, repo, event, news, report dossiers; cross-entity timeline;
  graph visualization (force-directed) over relationships.

---

## D3 — Discovery, Search & Recommendations

**Purpose.** Make finding things effortless and make recommendations feel
inevitable.

Three distinct surfaces:

### D3.a — Global Command Palette (cmd-K)
- Powered by `search_fuzzy` for prefix autocomplete + `search_all` for full
  results
- Returns mixed entity types with kind chip
- Shortcut to "Open in dossier", "Save", "Note", "Ask AI"

### D3.b — Full Search Page (`/search`)
- Query box + entity-kind tabs + facet filters (tags, layer, year, region)
- Hybrid mode toggle: Lexical (FTS) / Semantic (embedding) / Hybrid (RRF)
- Result cards include snippet, kind chip, save button
- "No results" suggests the assistant

### D3.c — Personalized Home Feed (`/`)
- Greeting strip (XP, streak, next-up module)
- Carousel: "Continue Learning"
- Carousel: "Recommended for you" (entities + modules)
- Carousel: "New in your interests" (news_item filtered by `interest_tags`)
- Carousel: "Talks you'd love" (videos filtered by tags + popularity)
- Carousel: "People to follow"
- Carousel: "From your saved" (recently active among saved items)

**Recommender mechanics (recommended).**
1. Build a per-user **interest vector** = mean of embeddings of (saved entities
   ∪ followed entities ∪ completed modules), weighted by recency. Stored as
   `profiles.metadata.interest_embedding` (no schema change required).
2. For each candidate type, run `match_chunks`-style hybrid scoring against
   the interest vector + tag overlap + freshness.
3. Cache per-user feed in `profiles.metadata.feed_cache_v1` with TTL; refresh
   on save/follow/complete events.

**Dependencies.** D1 (signals), D2 (candidates), D4 (positive feedback).

**MVP vs later.**
- MVP: cmd-K, full search page, basic home feed (saved + popular).
- Later: interest-vector recommender, news feed, "people to follow," weekly
  digest email.

---

## D4 — Personal Knowledge (Notes / Saves / Follows)

**Purpose.** The "private layer" over the public graph. Where exploration
becomes a personal corpus.

**Schema.**
- `saved_items(entity_type, entity_id, entity_title, entity_subtitle)` —
  polymorphic bookmark with denormalized title for fast list rendering
- `profile_followed_entity(entity_kind, entity_id)` — polymorphic follow,
  drives notification + feed
- `notes(title, content_json, content_text, entity_type, entity_id, entity_title, fts)`
  — rich-text notes, optionally entity-pinned

**Key user actions.**
- Save / unsave any entity (button on every dossier; appears in cmd-K)
- Follow / unfollow any entity
- Create a freeform note
- Create an entity-pinned note from a dossier
- Edit a note (rich-text: headings, lists, code blocks, embeds, links to
  entities, links to chunks/timestamps)
- Search across notes (uses `notes.fts`)
- Filter notes by entity type / pinned entity
- Export a note (markdown)

**Major screens.**
- `/saved` — list with type filter, sort (recent, A-Z), bulk actions (untag,
  delete, "open all in tabs")
- `/follows` — same as saved but for follows; shows "what's new since last
  visit" badges
- `/notes` — two-pane: left = note list (search + filter), right = editor
- `/notes/[id]` — focus mode for a single note
- Inline panel "My notes about X" inside every dossier

**Dependencies.** D1 (user), D2 (entity references), D3 (search-in-notes).

**MVP vs later.**
- MVP: save/unsave, follow/unfollow, freeform notes, entity-pinned notes,
  rich-text editor with code blocks + entity mentions, search-in-notes.
- Later: note collections / folders, public sharing of a note, AI summary of
  a note, smart "auto-tag" of new notes, weekly note digest, real-time
  collaborative editing.

---

## D5 — Curriculum (Courses & Modules)

**Purpose.** Turn the corpus into structured, opinionated learning paths.

**Schema.** `course`, `course_module`, `course_module_in_course (ord,
pinned_version, role)`, `course_module_requires (prereq_module_id)`,
`course_module_review`, `module_uses_artifact`, `course_enrollment (progress
JSON)`, `module_completion (quiz_score, attempts, time_spent_seconds)`.

**Key user actions.**
- Browse courses (filter by `domain_bucket`, `domain_layer`, level,
  est_hours, status=published)
- Browse standalone modules (filter by tag/layer/difficulty/duration)
- Open a course → see syllabus (ordered modules), prereqs, capstone preview,
  enroll button
- Enroll → adds row to `course_enrollment`
- Open a module → reader (markdown), inline `mini_quiz`, "mark complete"
- Complete a module → row in `module_completion`, +XP via `score_event`
- Review a module (curator-only later) → `course_module_review`
- View prerequisite DAG visually

**Major screens.**
- `/learn` — overview: enrolled courses + recommended next modules
- `/courses` — index with filters
- `/courses/[slug]` — course landing (overview, syllabus tree, prereqs,
  capstone, "Start Course" CTA)
- `/courses/[slug]/m/[moduleSlug]` — module reader (left: outline, center:
  content, right: notes + ask AI)
- `/modules` — standalone module browser (for ad-hoc learning, no enrollment)
- `/modules/[slug]` — module reader (no course context)

**Module reader anatomy.**
- Top: breadcrumb (Course → Module n/N), progress bar
- Left rail: course outline w/ checkmarks, prereq link
- Center: rendered MD body, code blocks, learning objectives, mini-quiz at
  end, "Mark complete" button
- Right rail: "Sources used" (pulls `module_uses_artifact`), "Your notes
  here" (notes pinned to this module), "Ask the AI" button (pre-fills
  context)

**Dependencies.** D1 (enrollment), D2 (sources/artifacts), D4 (notes), D7
(ask-the-AI), D6 (capstone challenge link).

**MVP vs later.**
- MVP: course/module index, course landing, module reader, mini-quiz
  scoring, completion tracking, XP awards.
- Later: prereq DAG visualizer, course version diffs, curator review UI,
  course recommendations based on completion history, certificate-of-
  completion exports.

---

## D6 — Arena (Challenges & Scoring) — *most complex, planned last*

**Purpose.** Convert reading into demonstrable skill via in-browser code
challenges judged by both tests and an LLM.

**Schema.** `challenge(slug, runtime, starter_code, task_md, rubric_md,
tests_blob, judge_model, judge_prompt_md, judge_rubric_version, deps_json,
metadata, est_minutes, course_id, module_id)`, `attempt(code_blob, sandbox_*,
tests_pass/total, judge_*, composite_score)`, `score_event(kind, points,
ref_kind, ref_id, source_attempt)`.

**Key user actions.**
- Browse challenges (filter by runtime, difficulty, est_minutes)
- Open a challenge → split-pane: task on left, editor on right
- Spin up a sandbox → starter code + deps loaded
- Run code → sandbox executes, returns logs
- Submit → tests run, judge runs, composite score computed, attempt persisted,
  XP awarded
- View attempt history (per challenge or per user)
- See composite score breakdown (tests % + judge %, weighted by
  `attempt.scoring_config`)

**Major screens.**
- `/challenges` — index with filter sidebar
- `/challenges/[slug]` — landing page: task preview, est_minutes, starter
  preview, history, "Begin attempt" CTA
- `/challenges/[slug]/attempt/[attemptId]` — IDE workspace
  - Left: collapsible task / rubric / hints tabs
  - Center: Monaco editor + integrated terminal (sandbox stdout)
  - Right: AI tutor chat (D7), test results, judge feedback, score panel
  - Bottom: action bar (Run, Submit, Reset, Save Draft)
- `/u/[username]/attempts` — public attempt history (if user `is_public`)
- `/leaderboard` — top XP earners, per-challenge fastest passes

**Sandbox abstraction.**
- A `lib/sandbox/provider.ts` interface with concrete impls: `e2b`, `modal`,
  `local-mock`. The schema's `attempt.sandbox_provider` already supports
  this.
- Sandbox lifecycle: `start → installDeps → writeFiles → exec(testsCmd) →
  exec(submitCmd) → terminate`. All steps emit events to a server-sent
  `attemptEvents` stream.

**Judging pipeline.**
1. On submit, persist `code_blob`.
2. Run tests in sandbox → `tests_pass / tests_total`.
3. Send {task_md, rubric_md, code_blob, test_output} to `judge_model` with
   `judge_prompt_md` → structured JSON `{score, feedback, dimensions[]}`.
4. Compute `composite_score` per `scoring_config` (e.g. `0.6*tests +
   0.4*judge`).
5. Insert `score_event(kind='challenge_pass', points, source_attempt)` if
   `composite_score >= passing_threshold`.
6. Increment `profiles.xp_total` via DB trigger or server action.

**Dependencies.** ALL prior domains. D5 for capstone wiring, D7 for tutor,
D1 for XP attribution, D4 for "save challenge for later" + notes during
solve.

**MVP vs later.**
- MVP: 1 runtime (Python), E2B provider, single-file challenges, tests-only
  scoring, no AI tutor. Just enough to ship one capstone.
- Then: LLM judge integration → composite scoring → XP/leaderboard.
- Later: multi-file challenges, multiple runtimes (TS, Bun), AI tutor with
  context window over the challenge, peer review of attempts, challenge
  publishing UI for curators.

---

## D7 — AI Assistant (cross-cutting)

**Purpose.** A grounded, entity-aware assistant that answers questions, drafts
summaries, and *takes actions* on behalf of the user.

**Schema.** `chunk` (RAG corpus), `match_chunks` RPC. Plus tool calls into
all other domains.

**Key user actions.**
- Open the assistant from anywhere (right-rail drawer or `/ask`)
- Ask a question, optionally with a "context chip" (an entity, a module, a
  saved item) pre-loaded
- See streamed answer with inline citations linking back to chunks (which
  link back to videos with timestamps, papers with sections, etc.)
- Click "Save this answer as a note" → writes to `notes` with citations
- Click "Add to my saved" on a cited entity
- Use the `/ask` page for a multi-turn session

**Tools (function-calls) the assistant can invoke.**
- `searchEntities({q, kinds[], limit})` → `search_all`
- `getEntity({kind, slug})` → typed dossier read
- `searchCorpus({q, filters})` → `match_chunks`
- `saveItem({kind, id})` → insert into `saved_items`
- `followEntity({kind, id})` → insert into `profile_followed_entity`
- `createNote({title, body, entity?})` → insert into `notes`
- `recommendNext({kind})` → recommender
- `enrollCourse({slug})` → insert into `course_enrollment`
- `startAttempt({challengeSlug})` → creates `attempt` row + sandbox session

**Modes.**
- **Inline ask** — right-drawer, single Q&A, current-screen context auto-attached
- **Conversation** — `/ask`, multi-turn, persistent history (stored in `notes`
  with `entity_type='conversation'` — *(assumption A-1 dependent)*)
- **Tutor** — inside a challenge attempt; constrained tool surface (no
  "submit for me"), context = task + current code

**Dependencies.** D2 (entities to cite), D3 (`match_chunks`), D4 (writes),
D5/D6 (writes via tools).

**MVP vs later.**
- MVP: streaming Q&A with citations, context-chip injection, inline drawer.
- Later: tool-calling actions, conversation history, tutor mode, voice
  input, scheduled briefings ("Catch me up on Evaluations weekly").

---

## Cross-cutting concerns

| Concern | Where it lives |
|---|---|
| Auth + RLS | Supabase Auth + per-table RLS policies (planning ref only) |
| Theming (dark/light) | App-shell level via Tailwind + `next-themes` |
| Navigation shell | App-shell layout: top bar (logo, cmd-K, avatar), left rail (Home, Explore, Notes, Saved, Learn, Challenges, Ask), right drawer (Assistant) |
| Notifications | Toast (`sonner`) for transient, badge counts on left rail for follows-with-news |
| Realtime | Assistant streaming (AI SDK), challenge sandbox events (SSE), follows-with-news (Supabase Realtime later) |
| Telemetry | PostHog + Sentry, event taxonomy keyed to domain |
