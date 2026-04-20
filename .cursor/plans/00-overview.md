# 00 — Executive Summary, Assumptions & Unknowns

## 1. Executive summary

We are designing a **personal AI-engineering operating system**: a place where a
practitioner lands, declares who they are and what they want to learn, and then
*explores, captures, learns, practices, and tracks progress* across the entire
AI-engineering ecosystem (people, orgs, libraries, papers, products, repos,
talks, events, news).

The schema reveals a system that is far richer than a typical "directory app":

- It is a **knowledge graph** of 11+ first-class entity types with explicit
  relationship tables (employment, founding, sponsorship, library-uses-library,
  appearances-in-video, presented-at-session, etc.).
- It is a **hybrid retrieval engine** — every entity has both `fts` and
  `embedding` columns, and there is a `chunk` table plus three RPCs
  (`search_all`, `search_fuzzy`, `match_chunks` with RRF) ready to power
  search, autocomplete, and RAG.
- It is a **personal capture layer** — `notes` (rich JSON content with FTS,
  optionally bound to an entity), `saved_items` (polymorphic bookmarks), and
  `profile_followed_entity` (polymorphic follows for feeds/notifications).
- It is a **structured learning platform** — `course`, `course_module`,
  `course_module_in_course` (ordered composition), `course_module_requires`
  (DAG of prerequisites), `course_module_review` (editorial workflow),
  `module_uses_artifact`, `course_enrollment`, `module_completion`.
- It is a **practice & assessment layer** — `challenge`, `attempt` (with
  sandbox session, code blob, judge feedback, composite score, test
  pass/fail), and a separate `score_event` ledger feeding `profiles.xp_total`
  for gamification.
- It is **versioned and editorial** — `is_latest_published` flags on `course`
  and `course_module`, plus a `course_module_review` decision log.

So the right framing for the app is:

> **A graph-native, AI-augmented learning platform** where the same canonical
> entities power discovery, personal annotation, course curricula, and
> challenge environments — all glued together by hybrid search and an
> entity-aware AI assistant.

This document and the others in this folder lay out the architecture without
implementing any of it.

## 2. The five product mental models

These are the lenses we'll keep returning to:

1. **Compass** — onboarding + profile = "what do you care about, where are you
   in the stack, what is your goal." Drives every personalization signal.
2. **Atlas** — entity exploration: profiles, dossiers, relationships, news.
   The "Wikipedia of AI engineering," but *typed and queryable*.
3. **Notebook** — personal capture: notes (entity-bound or freeform), saved
   items, follows. The user's private layer over the public graph.
4. **Curriculum** — courses & modules: opinionated paths through the corpus,
   with prerequisites, mini-quizzes, completion tracking, and reviews.
5. **Arena** — challenges, attempts, sandboxes, scoring, XP, leaderboards.
   Where learning becomes demonstrable skill.

Every screen we design should be locatable inside exactly one of these five
mental models.

## 3. What this plan is *not*

- Not a re-skin of the existing `aiengineerapp/app/(shell)/...` pages. The
  user has explicitly asked for an ambitious architecture. The current app is
  treated as a *demo of the data being there*, not as a design constraint.
- Not a sprint plan. There are no calendar dates and no team-role splits.
  Units are sequenced by **dependency**, not by week.
- Not a migration spec. We assume the schema is as documented in
  `database.types.ts` and only flag *new* tables when they are clearly
  required (and even then only as planning notes).

## 4. Assumptions and unknowns

We distinguish three confidence levels throughout the plan:

- **(inferred)** — directly grounded in the schema or wiki docs.
- **(recommended)** — our opinionated choice; replaceable.
- **(assumption)** — a gap we filled in ourselves; should be validated.

### 4.1 Inferred from schema/codebase

| # | Inference | Evidence |
|---|---|---|
| I-1 | App is multi-tenant per Supabase user; `profiles.id` is the auth user | `*_user_id_fkey -> profiles.id` everywhere |
| I-2 | Onboarding has explicit states (not just a boolean) | `profiles.onboarding_status: string` (default likely `'pending'`) |
| I-3 | The user picks a "home" curriculum layer for personalization | `profiles.home_layer` matches the L1–L5 taxonomy in `aiwiki/docs/03-taxonomy.md` |
| I-4 | Tag-based personalization is first-class | `profiles.expertise_tags`, `interest_tags`, `goals[]` |
| I-5 | Gamification is core, not bolt-on | `profiles.xp_total` + `score_event` ledger with `kind`, `points`, `ref_*` |
| I-6 | Bookmarks and follows are deliberately polymorphic | `saved_items(entity_type, entity_id)` and `profile_followed_entity(entity_kind, entity_id)` |
| I-7 | Notes are rich-text (Tiptap/ProseMirror-style) and entity-aware | `notes.content_json: Json`, `content_text` (FTS source), `entity_type`, `entity_id`, `entity_title` |
| I-8 | Hybrid search is already the strategy | `match_chunks(query_text, query_embedding, full_text_weight, semantic_weight, rrf_k)` |
| I-9 | A unified search box is expected | `search_all(q, kinds[], limit_count)` returns a normalized `{title, subtitle, snippet, slug, entity_kind, entity_id, rank}` row |
| I-10 | Autocomplete uses trigram fuzzy matching | `search_fuzzy(prefix, kinds[], limit_count)` |
| I-11 | Courses are versioned, modules are composable & ordered | `course.version`, `is_latest_published`, `course_module_in_course(ord, pinned_version)`, `course_module_requires(prereq_module_id)` |
| I-12 | Editorial review pipeline exists for modules | `course_module_review(decision, notes_md, version)` |
| I-13 | Challenges run in remote sandboxes with LLM judging | `attempt.sandbox_provider`, `sandbox_session_id`, `code_blob`, `tests_pass/total`, `judge_model`, `judge_feedback`, `composite_score`, `scoring_config` |
| I-14 | Capstones tie courses to challenges | `course.capstone_challenge_id -> challenge` |
| I-15 | News exists as a feed-eligible entity with rich relationship arrays | `news_item.related_*_slugs[]`, `importance`, `published_at` |
| I-16 | Images are first-class assets attached polymorphically to entities | `image` + `image_attachment(entity_kind, entity_id, role)` |
| I-17 | Entities are slug-addressable | every primary entity has `slug` (some unique, some w/ version) |

### 4.2 Recommendations (our calls)

| # | Recommendation | Why |
|---|---|---|
| R-1 | Use Next.js App Router with Server Components + Server Actions as the default | Pairs cleanly with Supabase RLS + edge auth, lets us colocate data fetching, avoids most client state |
| R-2 | shadcn/ui + Radix + Tailwind as the component spine | The schema demands a *lot* of bespoke UI (graph cards, dossiers, code editors). A library that gives us *primitives we own* beats a closed kit |
| R-3 | TanStack Query for client-side mutations and "live-ish" lists | We will have follow/save/unsave, note autosave, search-as-you-type — places where SWR-style cache + optimistic updates pay off |
| R-4 | Tiptap for the notes editor | `notes.content_json` shape strongly implies ProseMirror; Tiptap is the production-grade React wrapper |
| R-5 | Vercel AI SDK (already in stack) for the assistant + streaming generations | Provider-agnostic, supports tool calls into Supabase RPCs |
| R-6 | E2B (or Modal) for challenge sandboxes | `attempt.sandbox_provider` already anticipates this; E2B has the best DX for ephemeral code envs |
| R-7 | Monaco for the in-challenge editor | The de facto standard; LSP-ready if we ever want it |
| R-8 | cmdk for the global command palette / unified search | Feels native, plays well with `search_all` + `search_fuzzy` |
| R-9 | nuqs for URL-as-state on filter panels | Filters need to be deep-linkable on directory + search pages |
| R-10 | Zod + react-hook-form for forms | Onboarding, profile, note metadata, challenge submissions all benefit |
| R-11 | PostHog for product analytics + feature flags | Need both for staged rollout of recommender + assistant; one tool is cheaper than two |
| R-12 | Sentry for error monitoring | Standard, cheap, covers RSC + edge |
| R-13 | Playwright for e2e, Vitest for unit | Matches the Next.js + TS ecosystem |

### 4.3 Open assumptions to validate

| # | Assumption | Risk if wrong |
|---|---|---|
| A-1 | The "entity" types the user can save / note / follow are the entities listed in §1: person, organization, library, paper, product, repo, youtube_video, session, event, news_item, report, course, course_module, challenge | Medium — affects polymorphic union types and the entity-link UI |
| A-2 | Domain layer (`profiles.home_layer`) maps to the L1–L5 taxonomy from the wiki, not a different layer set | Low — easy to remap |
| A-3 | Recommendations are personalized by `interest_tags ∩ entity.tags` + embedding similarity over `profile.embedding` (which doesn't exist yet — would need to be derived from interest tags & saved items) | High — requires a recommender design pass |
| A-4 | Challenges support multiple runtimes (Python, TS, etc.); `challenge.runtime` is a free-form string today | Medium — sandbox provider abstraction must accept this |
| A-5 | The "AI engineer entity" the user wants to explore most often is *people* (engineers/founders/researchers) and the orgs they work at; libraries/papers/products are second-tier | Medium — affects default search filters and home page emphasis |
| A-6 | Notes are *single-user, private* by default (no `is_public` field on `notes`); only profiles have `is_public` | Low — matches schema |
| A-7 | The recommender is an explicit stage, not an implicit ranking inside `search_all` | Low — keeps responsibilities clean |
| A-8 | Realtime is desired for: assistant streaming, note co-edit (later), live challenge run output. Not for the directory feed | Medium — informs which screens use Supabase Realtime |
| A-9 | We will *not* expose admin/curator tooling in v1 — content seeding stays in `aiengineerapp/scripts/` | Low — scriptable workflow already exists |
| A-10 | The app will eventually surface `news_item` as a "Today in AI" feed gated by the user's `interest_tags` and `home_layer` | Medium — needs a publish pipeline; v1 can be passive |

## 5. North-star user stories

Used as a sanity check for every implementation unit:

1. *"I'm new. Tell the app I'm a backend dev moving into agents, and have it
   build me a home that respects that."*
2. *"Show me everyone who's spoken on evaluations in the last year, ordered
   by how often they're cited in the corpus."*
3. *"Open Agenta's profile. Save it. Take a note. Follow it so I get news."*
4. *"Search 'GEPA' across talks, papers and dossiers. Click a video, jump to
   timestamp 12:45, take a note pinned to that video."*
5. *"Recommend me three modules I should take next, given what I've saved
   and completed."*
6. *"Take the Evaluations course. Pass the capstone challenge in a sandbox
   that grades my code with both tests and an LLM judge."*
7. *"Show me my XP, my streak, what I've completed, what's next."*

If a screen doesn't serve at least one of those stories, it doesn't ship.
