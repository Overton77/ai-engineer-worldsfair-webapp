# 03 — Low-Fidelity Wireframes

Textual wireframes for the major screens. Each wireframe lists:
**Purpose**, **Regions**, **Primary interactions**, **Navigation**, **Data dependencies**.

> **Note (M3 rethink):** the **Notes** sections — the "Notes (3)"
> tab inside §D and the entire §G **Notes Workspace** — have been
> superseded by [`03a-notes-rethink-wireframes.md`](./03a-notes-rethink-wireframes.md).
> That doc introduces three invocable notes surfaces (drawer, split,
> watch+notes) instead of a single destination workspace. Read 03a
> first when planning M3 (Capture v1).

Legend:
- `[Button]` — actionable button
- `<…>` — dynamic content slot
- `║` — split-pane divider
- `─` — horizontal divider
- `▸` — collapsible section
- `🔍` `★` `🔔` `📝` — icons (search/save/follow/note)

---

## Global App Shell

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo AIE]  [🔍 Search anything…  ⌘K]              [🔔 3]  [👤 avatar ▾]   │
├─────────┬─────────────────────────────────────────────────────────┬─────────┤
│ ▸ Home  │                                                         │ ◂ AI    │
│ ▸ Explr │                                                         │   Asst. │
│ ▸ Notes │              <Page content area>                        │  drawer │
│ ▸ Saved │                                                         │ (toggle)│
│ ▸ Folws │                                                         │         │
│ ▸ Learn │                                                         │         │
│ ▸ Arena │                                                         │         │
│ ─────── │                                                         │         │
│ ▸ Asst. │                                                         │         │
│ ─────── │                                                         │         │
│ XP 1240 │                                                         │         │
│ 🔥 5dy  │                                                         │         │
└─────────┴─────────────────────────────────────────────────────────┴─────────┘
```

- **Left rail**: persistent nav. Bottom shows XP & streak.
- **Top bar**: cmd-K trigger always visible. Notifications bell pulls from
  follows-with-news.
- **Right drawer**: AI assistant, collapsed by default; opens with `⌘.` or
  click; remembers state per-route.

**Data dependencies**: `profiles.xp_total`, follow-news count, current user.

---

## A. Onboarding & Profile

### A1. Onboarding Wizard `/onboarding/[step]`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│   Step 2 of 5  ●●○○○                                          [Skip]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Who are you, in one sentence?                                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Backend engineer moving into agent systems                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Headline (shows on your profile)                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ AI-curious staff engineer @ <org>                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Experience level                                                          │
│   ( ) Curious   ( ) Building   (●) Shipping   ( ) Researching               │
│                                                                             │
│                                                  [Back]   [Continue →]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Steps (one screen each):**
1. **Welcome** — value prop, "let's set up your space"
2. **Identity** — display name, headline, experience level
3. **Interests** — multi-select chips of 26 categories (`interest_tags[]`)
4. **Goals** — multi-select common goals (`goals[]`): Build a side project,
   Switch into AI eng, Stay current, Teach others, Ship at work, Get hired
5. **Home Layer** — choose your "altitude" (L1 Intelligence … L5 Governance)
6. **Done** — preview personalized home; CTA "Start exploring"

**Interactions**: forward/back, skip-to-end with sensible defaults, autosave
each step to `profiles`. `onboarding_status` updates per step.

**Data**: `profiles` insert/update; tag list driven by taxonomy doc.

### A2. Profile Edit `/settings/profile`

```
┌──── Profile ─────────────────────────────────────────────────────────────┐
│ [Avatar drop here]  Display name [_______]  Username [@________]         │
│                     Headline    [____________________________________]   │
│ Pronouns  Country  Timezone                                              │
│ [____]    [_____]  [______________]                                      │
├──── About ───────────────────────────────────────────────────────────────┤
│ Bio (markdown)  ┌────────────────────────────────────────────────────┐   │
│                 │                                                    │   │
│                 └────────────────────────────────────────────────────┘   │
├──── Tags ────────────────────────────────────────────────────────────────┤
│ Expertise tags    [+ add]   • python  • llm-evals ×                      │
│ Interest tags     [+ add]   • agents  • rag      ×                       │
│ Goals             [+ add]   • Ship at work ×                             │
├──── Linked accounts ─────────────────────────────────────────────────────┤
│ GitHub  [Connect]    LinkedIn [Connect]    Twitter [Connect]             │
├──── Visibility ──────────────────────────────────────────────────────────┤
│ ( ) Private    (●) Public profile (others can see your saves & XP)       │
└──────────────────────────────────────────────────────────────────────────┘
                                                          [Discard] [Save]
```

**Data**: `profiles` row.

---

## B. Personalized Home `/`

```
┌─ Welcome back, <name>. ─────────────────────────────────────────────────┐
│ XP 1240  🔥 5-day streak       Next up: GEPA basics — 18 min  [Resume]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Continue learning                                              [See all]│
│  ┌─Card─┐  ┌─Card─┐  ┌─Card─┐                                           │
│  │Module│  │Course│  │Module│                                            │
│  │ 60%  │  │ 33%  │  │ 12%  │                                            │
│  └──────┘  └──────┘  └──────┘                                            │
│                                                                          │
│  Recommended for you                                            [See all]│
│  ┌─Card─┐  ┌─Card─┐  ┌─Card─┐  ┌─Card─┐                                  │
│  │Person│  │Library│  │Talk │  │Module│                                  │
│  └──────┘  └───────┘  └─────┘  └──────┘                                  │
│                                                                          │
│  New in your interests                                          [See all]│
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ <news_item.title>   <hero img>   <published_at relative>          │   │
│  │ <summary>                                                          │   │
│  │ chips: <tags>                                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ <news_item> …                                                      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Talks you'd love                                               [See all]│
│  <thumbnail grid of youtube_videos filtered by interest_tags>           │
│                                                                          │
│  People to follow                                               [See all]│
│  <person cards w/ follow buttons>                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Interactions**: each card has hover `[★ Save]` `[🔔 Follow]`; clicking
opens dossier; carousels horizontally scrollable.

**Data**: recommender output (D3.c), `course_enrollment`, `module_completion`,
`news_item`, `youtube_video`, `person`. All filtered by user's interests.

---

## C. Explore (Entity Index) `/explore/[type]`

```
┌─ Explore ────────────────────────────────────────────────────────────────┐
│ [People] [Orgs] [Libraries] [Papers] [Products] [Repos] [Talks] [Videos]│
│ [Events] [News] [Reports]                                                │
├──────────────────────────────────────────────────────────────────────────┤
│ 🔍 Search People…                                              [⌘K hint] │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ q: gepa evaluations                                            [Clear]│ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ Match mode: [Lexical (FTS) ●] [Hybrid (FTS + semantic) ○ — coming soon] │
├──────────────────────────────────────────────────────────────────────────┤
│ Filters                       │ 847 results · sort [Best match ▾]        │
│ ───────────────────────────── │  ┌────────────────────────────────────┐  │
│ Layer                         │  │ Avatar  Name              [★] [🔔] │  │
│ [✓] L1 Intelligence           │  │ Role @ Org · Country · 5 tags      │  │
│ [✓] L2 Agents                 │  │ <snippet w/ <mark>highlights</mark>>│  │
│ [ ] L3 Systems                │  │ Appears in 23 talks · 2 papers     │  │
│ [ ] L4 Application            │  └────────────────────────────────────┘  │
│ [ ] L5 Governance             │  ┌────────────────────────────────────┐  │
│                               │  │ …                                  │  │
│ Tags         [+ add]          │  └────────────────────────────────────┘  │
│ • agents ×                    │  …                                       │
│ • rag    ×                    │  [Load more]                             │
│                               │                                          │
│ Region                        │                                          │
│ [✓] North America             │                                          │
│ [ ] Europe                    │                                          │
│ ...                           │                                          │
│                               │                                          │
│ Year active                   │                                          │
│ [2023] ──●─── [2026]          │                                          │
│                               │                                          │
│ [Reset filters]               │                                          │
└───────────────────────────────┴──────────────────────────────────────────┘
```

**Interactions**:
- **Per-entity full-text search** scoped to the active tab. The input
  filters the displayed entity type only — switching tabs preserves `q`
  (carries across `/explore/people` → `/explore/orgs` etc.) so the user
  can refine the same query against different kinds.
- Filters + query sync to URL via `nuqs`
  (`/explore/people?q=gepa+evaluations&layer=L1,L2&tag=agents,rag&region=na`).
- Debounced `q` (250 ms) with a Server Action that runs
  `where fts @@ websearch_to_tsquery('english', $q)` against the active
  entity table, plus the existing facet predicates. Empty `q` falls back
  to the unfiltered list.
- When `q` is non-empty, the result snippet is generated server-side via
  `ts_headline('english', search_text, websearch_to_tsquery('english',
  $q))` so the `<mark>` highlights match the live tsquery.
- Sort defaults to `ts_rank_cd(fts, websearch_to_tsquery(...))`
  (`Best match`) when `q` is non-empty; otherwise to the prior default
  (`Popularity`).
- Per-card quick actions: save, follow, "Open"
- Other sort options: Popularity / Most cited in corpus / Recently active
  / A-Z.
- Infinite scroll or "Load more".
- A11y: input is a labelled `<search>` landmark; results region has
  `aria-live="polite"` so SR users hear "847 results" updates as they
  type.

**Data**: per-active-tab table query — every entity table that this tab
exposes already carries a generated `fts tsvector` column with `setweight`
applied (A=title, B=search_text, C=tags/body), backed by a
`gin (fts)` index. Tables in scope:
- `person.fts`, `organization.fts`, `library.fts`, `paper.fts`,
  `product.fts`, `repo.fts` (M3)
- `youtube_video.fts`, `session.fts` (M1 + M2 follow-up)
- `event.fts` (M2)
- `news_item.fts` (M6)
- `report.fts` (M4)
Junction-table counts (`person_appeared_in_video`, etc.) for the per-row
"Appears in N talks" suffix come from a single batched aggregate query
keyed off the page of result IDs.

**Why per-entity-type FTS, not the cross-entity `search_all` RPC**
- This page is intentionally typed: a person card looks different from a
  library card, has different facets, and ranks against different signal.
  `search_all` is the right tool for the global ⌘K bar / `/search` page
  (Section E); here we want type-specific weighting + type-specific facets.

**Hybrid (FTS + semantic) — phase-2 upgrade path**
- The `Match mode` toggle currently has only **Lexical (FTS)** active.
- Phase 2 wires a `match_<entity>` RPC per entity type that fuses
  `ts_rank_cd` over `fts` with cosine similarity over the entity's
  `embedding vector(1536)` column (already present on every entity table)
  via Reciprocal Rank Fusion — same RRF pattern the chunk-store
  `match_chunks` RPC already uses.
- The toggle becomes interactive when the corresponding RPC ships;
  switching mode only changes the ranking RPC, not the URL params or the
  card layout.
- One RPC per type (not a generic one) so the embedder column is
  unambiguous and Postgres can use the right HNSW index.

---

## D. Entity Dossier `/p/[slug]` (Person example, pattern reused)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ < back to People                                                         │
│                                                                          │
│ ┌─ Hero ────────────────────────────────────────────────────────────────┐│
│ │ [Avatar 96px]  <Full name>                          [★ Save] [🔔]    ││
│ │                <tag_line>                           [📝 Note] [🤖 Ask]││
│ │                <role_title> @ <org link>                              ││
│ │                <city>, <country>  ·  GitHub · LinkedIn · X            ││
│ │                Tags: <expertise_tags>                                 ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ ┌─ Tabs ────────────────────────────────────────────────────────────────┐│
│ │ [Overview] [Relationships] [In the corpus] [Media] [Notes (3)]       ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ Overview                                                                 │
│   <bio markdown>                                                         │
│   "Notable for: <notable_for>"                                           │
│                                                                          │
│ Relationships                                                            │
│   ▸ Works at         <org link>                                          │
│   ▸ Founded          <org links>                                         │
│   ▸ Co-authored with <person chips>                                      │
│   ▸ Frequently cites <library chips>                                     │
│   ▸ Speaks at        <event chips>                                       │
│                                                                          │
│ In the corpus                                                            │
│   Talks (12)                                                             │
│   ┌─ Video card ──────────────────────────────────────┐                  │
│   │ thumb · title · channel · duration · view_count   │                  │
│   │ "Appeared as: Speaker"                            │                  │
│   └───────────────────────────────────────────────────┘                  │
│   Papers authored (4)  …                                                 │
│   Sessions presented (7) …                                               │
│   Mentions in news (9) …                                                 │
│                                                                          │
│ Notes (3)                                                                │
│   ┌─ Note card ─────────────────────────────────────┐                    │
│   │ <title>     <updated_at>            [Open]      │                    │
│   │ <preview text>                                  │                    │
│   └─────────────────────────────────────────────────┘                    │
│   [+ New note about <Person>]                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Interactions**:
- Save / Follow are optimistic with toast confirm.
- "📝 Note" opens the note editor pre-bound to this entity.
- "🤖 Ask" opens the assistant drawer with this entity as a context chip.
- Each chip / link in Relationships navigates to the related dossier.

**Data**: per-entity row + every relevant junction table + `notes` filtered by
`entity_type='person' AND entity_id=this`.

**Variants per entity type**:
- Org: replace bio with `overview`; add Sponsored events, Funding history,
  Flagship products, Repos, Team (CEO, employees, founders)
- Library: GitHub stats, last release, language, Used by orgs, Appears in
  talks, Papers citing
- Paper: abstract + PDF link, Authors, Citations, Appears in talks
- Video: embedded player + chapters; Speakers, Libraries mentioned, Papers
  mentioned, Products mentioned, Linked session, Linked event
- Talk/Session: linked video, linked event, speakers, libraries, abstract,
  slides
- Event: schedule/sessions, attendees, sponsors, region, dates
- News: full body, hero image, related entities, source link
- Report: rendered MD, citations as chip lists

---

## E. Search Page `/search?q=…`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔍 [GEPA evaluations                                ]   Mode: [Hybrid ▾] │
├──────────────────────────────────────────────────────────────────────────┤
│ All (47)  People (3)  Orgs (1)  Libraries (2)  Papers (4)  Talks (15)    │
│ Videos (15)  Modules (4)  Notes (3)                                      │
├──── Facets ────┬─────────────────────────────────────────────────────────┤
│ Layer          │ ┌─ result ──────────────────────────────────────────┐   │
│ Tags           │ │ [kind chip] <title>                       [★] [🔔]│   │
│ Year           │ │ <subtitle>                                        │   │
│ Region         │ │ <snippet with <mark>highlights</mark>>            │   │
│ Has video      │ │ rrf 0.81 · pop 0.72                               │   │
│ Has paper      │ └───────────────────────────────────────────────────┘   │
│ ...            │ ┌─ result ──┐ …                                         │
│                │                                                         │
│ [Reset]        │ [Load more]                                             │
├────────────────┴─────────────────────────────────────────────────────────┤
│ No exact matches?  [Ask the AI assistant about "GEPA evaluations" 🤖]    │
└──────────────────────────────────────────────────────────────────────────┘
```

**Interactions**:
- Mode toggles call different RPC mixes: Lexical=`search_all`,
  Semantic=`match_chunks` (no text), Hybrid=`match_chunks` (default weights).
- Tabs filter by `kinds[]`.
- Facet selections re-issue search.
- "Ask the AI" opens drawer with query + selected kinds as context.

**Data**: `search_all`, `match_chunks`, plus typed pulls for displayed cards.

---

## F. Saved `/saved`  &  Follows `/follows`

```
┌─ Saved (123) ────────────────────────────────────────────────────────────┐
│ Filter by type: [All] [People] [Orgs] [Libraries] [Talks] [Modules] …    │
│ Sort: [Recently saved ▾]    [Bulk select] [Open in tabs] [Remove]        │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌─ row ─────────────────────────────────────────────────────────────┐   │
│ │ □ [icon] <entity_title>                          saved 2d ago     │   │
│ │   <entity_subtitle>                              [Open] [Note] [✕]│   │
│ └───────────────────────────────────────────────────────────────────┘   │
│ ┌─ row ─────────────────────────────────────────────────────────────┐   │
│ │ □ [icon] …                                                        │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│ …                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

`/follows` is the same shape but adds an "Updates since you last visited"
ribbon and "🔴 N new" badges per row.

**Data**: `saved_items`, `profile_followed_entity`, plus joined news for the
"new" badges.

---

## G. Notes Workspace `/notes`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔍 Search notes…                                              [+ New]    │
├─────────────────────────┬────────────────────────────────────────────────┤
│ Filters                 │  Title: <My note title>          updated 2m ago│
│  All notes (87)         │  Pinned to: [chip Person: Shreya] [✕]          │
│  Pinned to entity       │ ────────────────────────────────────────────── │
│   ▸ People (12)         │  [B] [I] [H] [• =] [{ }] [<>] [@ mention]      │
│   ▸ Orgs (8)            │ ────────────────────────────────────────────── │
│   ▸ Libraries (5)       │                                                │
│   ▸ Talks (22)          │  ## Why GEPA matters                           │
│   ▸ Modules (6)         │                                                │
│  Freeform (34)          │  GEPA pairs … see @library:agenta              │
│                         │                                                │
│ Tags                    │  ```python                                     │
│  [+ filter by tag]      │  judge.run(samples)                            │
│                         │  ```                                           │
│ ─────────────────────── │                                                │
│ Note list               │  - [ ] Calibrate against ground truth          │
│ ┌──────────────────┐    │  - [x] Read Agenta dossier                     │
│ │<title>           │    │                                                │
│ │<preview><date>   │    │  > See cited chunk: <video:Xz5… @12:45>        │
│ └──────────────────┘    │                                                │
│ ┌──────────────────┐    │                                                │
│ │…                 │    │                                                │
│ └──────────────────┘    │                                                │
│                         │                                                │
│                         │  [Export markdown] [Share (later)] [Delete]    │
└─────────────────────────┴────────────────────────────────────────────────┘
```

**Interactions**:
- Editor autosaves debounced (Tiptap → JSON → server action → `notes` row).
- `@`-mention opens entity picker (cmdk-style); inserts a typed mention node
  that renders as a chip and links to the dossier.
- "Pinned to" chip can be added/removed; setting it writes
  `entity_type/entity_id/entity_title`.
- Search uses `notes.fts` server-side (Postgres FTS) plus client filtering by
  pinned-entity type.

**Data**: `notes` (CRUD), entity lookup via `search_all`/`search_fuzzy` for
`@`-mentions.

---

## H. Learn Hub `/learn`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Continue                                                                 │
│ ┌─ Course in progress ──────────────────────────────────────────────────┐│
│ │ Evaluations Full Course      ███████░░░ 70%   3 of 8 modules           ││
│ │ Next: Mini-quizzes & rubrics                                [Resume]   ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ Recommended courses                                              [See all]│
│ ┌─C─┐ ┌─C─┐ ┌─C─┐                                                        │
│ Standalone modules for you                                       [See all]│
│ ┌─M─┐ ┌─M─┐ ┌─M─┐ ┌─M─┐                                                  │
│                                                                          │
│ Browse all  [Courses (12)] [Modules (84)] [Challenges (23)]             │
└──────────────────────────────────────────────────────────────────────────┘
```

### H1. Course Landing `/courses/[slug]`

```
┌─ Hero ───────────────────────────────────────────────────────────────────┐
│ <title>            Layer L5 · Bucket Evaluations · 8 modules · ~6h        │
│ <summary>                                                                 │
│ Authors: <chips>         Status: published · v1.2.0                       │
│ [Enroll] [★ Save] [🔔 Follow]                                              │
├─ Learning path ──────────────────────────────────────────────────────────┤
│ 1. Why LLM judges fail            ✓ done    20m  ●●●○○                   │
│ 2. GEPA basics                    in prog   18m  ●●○○○                   │
│ 3. Calibration with ground truth  locked    25m                          │
│    └ requires: 2                                                         │
│ 4. Pairwise vs scalar             locked    30m                          │
│ …                                                                         │
│ ★ Capstone challenge: "Build & calibrate your judge"  [Preview]          │
├─ Prereq DAG ─────────────────────────────────────────────────────────────┤
│  [tiny graph viz, later]                                                 │
├─ What you'll learn ──────────────────────────────────────────────────────┤
│ • bullet list from learning_objectives aggregated                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### H2. Module Reader `/courses/[slug]/m/[moduleSlug]`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ <Course breadcrumb>  Module 2 / 8           ████░░░░ 50% in this course  │
├────────────┬───────────────────────────────────────┬─────────────────────┤
│ Outline    │  # GEPA basics                        │ Sources used        │
│  ▸ Why …✓  │  Difficulty: intermediate · 18 min    │  • Video: Agenta…   │
│  ▸ GEPA●   │  Objectives:                           │  • Repo: agenta-ai  │
│  ▸ Calib   │   • …                                  │  • Dossier: Agenta  │
│  ▸ Pair    │   • …                                  │                     │
│  ▸ …       │ ────────────────────────────────────── │ Your notes here (2) │
│            │  ## Why this matters                   │  ┌────────────────┐ │
│ Prereqs    │  …                                     │  │<note preview>  │ │
│  • Why…✓   │                                        │  └────────────────┘ │
│            │  ## Walkthrough                        │  [+ New note]       │
│            │  …                                     │                     │
│            │                                        │ Ask the AI 🤖       │
│            │  ## Mini-quiz                          │  [pre-fills module] │
│            │   1. Pairwise comparisons typically …  │                     │
│            │      ( ) A   (●) B   ( ) C             │                     │
│            │   2. …                                 │                     │
│            │      [Submit quiz]                     │                     │
│            │                                        │                     │
│            │  [✓ Mark complete]    [Next module →]  │                     │
└────────────┴───────────────────────────────────────┴─────────────────────┘
```

**Interactions**:
- Mark complete → insert `module_completion` row → `score_event` → XP toast.
- Mini-quiz submit → score saved on `module_completion.quiz_responses`.
- "Sources used" pulls `module_uses_artifact` rows.
- Right rail "Your notes" filters `notes` by `entity_type='module'` +
  `entity_id=module_id` *(assumption A-1 — confirm we treat module as an
  entity-kind for notes)*.

---

## I. Arena `/challenges/[slug]/attempt/[attemptId]`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ < Course / Capstone                       Attempt #3   Started 12m ago   │
├──────────┬────────────────────────────────────────┬──────────────────────┤
│ Tabs     │                                        │ AI Tutor 🤖          │
│ [Task]   │  // editor                             │ ┌──────────────────┐ │
│ [Rubric] │  ┌────────────────────────────────────┐│ │ Hi! Need a hint? │ │
│ [Hints]  │  │ 1  from agenta import Judge        ││ └──────────────────┘ │
│ [Files]  │  │ 2  judge = Judge(...)              ││ ────────────────────│
│          │  │ 3  ▌                               ││ Tests               │
│ Task:    │  │ 4                                  ││ ✓ test_basics       │
│ Build a  │  │ 5                                  ││ ✗ test_calibration  │
│ pairwise │  │ …                                  ││   AssertionError…   │
│ judge    │  └────────────────────────────────────┘│ ────────────────────│
│ that …   │                                        │ Judge feedback      │
│          │ ─ Terminal ───────────────────────────│ "Your code addresses│
│ Rubric:  │  $ pytest -q                          │  most of the rubric…│
│ • Calls  │  collected 4 items                    │  but lacks calibra- │
│   judge  │  test_basics PASSED                   │  tion against …"    │
│   API    │  test_calibration FAILED              │ ────────────────────│
│ • Handles│                                        │ Score 62 / 100      │
│   ties   │                                        │  • Tests 50/100     │
│ • …      │                                        │  • Judge 78/100     │
├──────────┴────────────────────────────────────────┴──────────────────────┤
│ [▶ Run]  [Submit]  [Reset to starter]  [Save draft]   sandbox: e2b · ok  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Interactions**:
- Run → exec test cmd in sandbox; stream stdout to terminal.
- Submit → run tests + LLM judge → write `attempt` row → compute composite
  → `score_event` → XP toast + score panel update.
- AI Tutor sees current code, task md, last test output; cannot directly
  modify code (writes are constrained).

**Data**: `challenge`, `attempt`, sandbox provider events, AI SDK stream.

### I1. Challenges Index `/challenges`

```
┌─ Challenges ─────────────────────────────────────────────────────────────┐
│ Filters     │ 23 challenges                                              │
│ Runtime     │ ┌─ challenge card ───────────────────────────────────────┐ │
│ [Python]    │ │ <title>                runtime: python · ~45 min       │ │
│ [TS]        │ │ <task summary>                                         │ │
│ Difficulty  │ │ Course: Evaluations · Capstone                         │ │
│ [Beginner]  │ │ Your best: 78 / 100   ·   tries: 3                     │ │
│ [Intermed.] │ │                                  [★] [Begin attempt]   │ │
│ [Advanced]  │ └────────────────────────────────────────────────────────┘ │
│ Course      │                                                             │
│ [...]       │                                                             │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## J. AI Assistant Drawer (cross-cutting)

```
┌── AI Assistant ──────────────────[ × ]┐
│ Context chips:                          │
│  [Person: Shreya ✕] [Module: GEPA ✕]    │
│  [+ Add context]                        │
├─────────────────────────────────────────┤
│ User: How does GEPA differ from RLHF?   │
│                                         │
│ AI: GEPA is a [streaming]…              │
│   ┌─ Citation 1 ──────────────────────┐ │
│   │ video: Agenta GEPA workshop @14:02│ │
│   │ "GEPA optimizes the judge by …"   │ │
│   │ [Open] [Save] [Note this]         │ │
│   └───────────────────────────────────┘ │
│   ┌─ Citation 2 ─ paper: …            │ │
│                                         │
│ Suggested actions:                      │
│  [Save: Agenta] [Enroll: Eval course]   │
│                                         │
├─────────────────────────────────────────┤
│ [Ask anything…                       ↑] │
│ Tools used: searchCorpus · getEntity    │
└─────────────────────────────────────────┘
```

**Interactions**:
- Context chips persist per-session; auto-injected from current page.
- Citations are clickable → open dossier or media at timestamp.
- "Save / Note / Enroll" buttons execute tool calls server-side.
- `/ask` page is the same component but full-screen with conversation list
  on the left.

**Data**: `chunk` via `match_chunks`, `search_all`, mutation tools.

---

## K. Settings & Misc

- `/settings/account` — email, password, sessions, danger zone.
- `/settings/notifications` — toggle which follows produce alerts.
- `/settings/integrations` — GitHub/LinkedIn/X reconnects, API keys *(later)*.
- `/u/[username]` — public profile (when `is_public=true`): bio, expertise,
  XP, public attempts, public notes *(if we add public notes later)*.
- `/leaderboard` — top XP earners (D6 v2).
