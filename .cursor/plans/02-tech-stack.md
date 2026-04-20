# 02 — Tech Stack & Library Decisions

Each row: **what problem**, **why it fits**, **why over simpler alts**,
**adopt now / defer**.

## Decision matrix

| # | Concern | Choice | Adopt |
|---|---|---|---|
| T-1 | Framework | **Next.js 15+ (App Router, RSC, Server Actions)** | Now |
| T-2 | Language / typing | **TypeScript strict + `Database` types from supabase-cli** | Now |
| T-3 | DB / Auth / Storage / Realtime | **Supabase** (Postgres, RLS, Auth, Storage, Realtime, pgvector) | Now |
| T-4 | Component primitives | **shadcn/ui** (Radix + Tailwind, copy-in) | Now |
| T-5 | Styling | **Tailwind CSS v4** + CSS variables for theme tokens | Now |
| T-6 | Theming | **next-themes** (system / light / dark) | Now |
| T-7 | Icon set | **lucide-react** | Now |
| T-8 | Forms | **react-hook-form** + **zod** | Now |
| T-9 | Schema validation (server) | **zod** in Server Actions + API routes | Now |
| T-10 | Server-state cache | **TanStack Query** for client mutations & "live-ish" UI; RSC for first paint | Now |
| T-11 | URL-as-state | **nuqs** for deep-linkable filters | Now |
| T-12 | Command palette / fuzzy UI | **cmdk** | Now |
| T-13 | Rich text (notes) | **Tiptap** (ProseMirror) + extensions: code-block, mention, link, task-list | Now (D4 milestone) |
| T-14 | Markdown rendering (read-only) | **react-markdown** + **shiki** for code highlight | Now |
| T-15 | Code editor (challenges) | **Monaco** (`@monaco-editor/react`) | Defer to D6 |
| T-16 | Sandbox runtime | **E2B** primary, **Modal** as alt; abstracted by `lib/sandbox/provider.ts` | Defer to D6 |
| T-17 | AI SDK | **Vercel AI SDK** + provider packages: `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/anthropic` (optional) | Now (assistant unit) |
| T-18 | Embeddings | **`text-embedding-3-large`** (OpenAI) **or** Gemini `text-embedding-004`; whichever already populates `embedding`. Stored in pgvector. | Reuse existing |
| T-19 | Web research tool for assistant | **Tavily** for grounded web search tool | Defer to assistant v2 |
| T-20 | Chart / data viz | **Recharts** for simple stats (XP, completions); **react-force-graph** later for entity graph | Defer (graph viz: later) |
| T-21 | Notifications / toasts | **sonner** | Now |
| T-22 | Date / time | **date-fns** + **date-fns-tz** | Now |
| T-23 | Image handling | **next/image** + Supabase Storage signed URLs; `blurhash` decode for placeholders | Now |
| T-24 | Email (transactional) | **Resend** + **react-email** | Defer (digest emails) |
| T-25 | Analytics + flags | **PostHog** | Now (basic events) |
| T-26 | Error monitoring | **Sentry** (Next.js SDK) | Now |
| T-27 | Logging | **pino** for server-side logs to Vercel | Now |
| T-28 | Rate limiting | **@upstash/ratelimit** + Upstash Redis | Defer to assistant launch |
| T-29 | Background jobs | **Inngest** (event-driven, types-friendly) for: feed cache refresh, judging pipeline retries, news ingestion fanout | Defer to recommender / D6 |
| T-30 | Unit tests | **Vitest** + **@testing-library/react** | Now (set up early) |
| T-31 | E2E tests | **Playwright** | Defer until shell stable |
| T-32 | Component dev | **Storybook** *(optional)* — only if multiple devs | Defer |
| T-33 | Feature flags | PostHog flags (re-uses T-25) | Defer |
| T-34 | Authz beyond RLS | Server-side helper `assertOwner(userId, row)` — no extra lib | Now |
| T-35 | Drag/drop (note re-order, challenge file tree) | **dnd-kit** | Defer |
| T-36 | Animations | **Tailwind transitions + framer-motion** *only* for assistant panel + onboarding | Now (light usage) |
| T-37 | Internationalization | None v1; design strings to be wrappable later | Defer |
| T-38 | Search infra | Supabase functions: `search_all`, `search_fuzzy`, `match_chunks`. **No Algolia / Meilisearch** — schema makes external search redundant | Now |
| T-39 | Sandbox SSE / streams | Native Web Streams + AI SDK + EventSource for sandbox events | Defer to D6 |
| T-40 | Diff / version display (course) | **diff-match-patch** + custom render | Defer |

---

## Detailed justifications

### T-1 — Next.js App Router
- **Problem:** SSR-rendered, SEO-friendly entity pages with auth-gated data and
  streaming AI responses, all on a Vercel-friendly runtime.
- **Why fits:** Server Components let us colocate Supabase reads with the
  pages that need them; Server Actions remove most "POST-then-revalidate"
  ceremony for save / follow / note creates; streaming aligns with the AI
  SDK.
- **Why over simpler alts:** Pages Router still works but lacks RSC + actions,
  so we'd hand-write more API + client glue. Remix is comparable but the
  Vercel AI SDK and Supabase examples lean Next.

### T-4/T-5 — shadcn/ui + Tailwind
- **Problem:** Many bespoke layouts (graph cards, dossiers, IDE workspace,
  rich-text toolbar) that need to look cohesive but evolve fast.
- **Why fits:** Code is *in our repo*, so we can refactor any component
  without waiting on a library release. Radix gives us accessibility for
  free.
- **Why over simpler alts:** A closed kit (MUI, Mantine, Chakra) ships fast
  but constrains custom UX (split panes, IDE chrome, kanban-style course
  syllabi) and bloats CSS. Plain Tailwind only is faster initially but loses
  consistency without primitives.

### T-10 — TanStack Query (alongside RSC)
- **Problem:** Optimistic save/unsave/follow/unfollow, note autosave every
  500ms, search-as-you-type with cancellation.
- **Why fits:** TanStack Query has the best mutation + optimistic-update
  story in React; pairs cleanly with Server Actions returning JSON.
- **Why over simpler alts:** SWR is fine for reads but mutation ergonomics
  are weaker. Pure Server Actions + `useFormState` is great for forms but
  awkward for "click save" buttons everywhere.

### T-11 — nuqs
- **Problem:** Filter state on `/explore`, `/search`, `/courses`, `/saved`,
  `/notes` must be deep-linkable and survive refresh.
- **Why fits:** Tiny, type-safe, integrates with App Router's
  `searchParams`.
- **Why over simpler alts:** Hand-rolling URL sync via `useSearchParams` is
  error-prone with nested filters. Zustand + manual URL sync is heavier.

### T-12 — cmdk
- **Problem:** Global cmd-K palette is the *primary* nav for power users
  given the size of the entity space.
- **Why fits:** Composable, headless, used by Linear/Vercel/etc. Keyboard
  semantics correct out of the box. Pairs with `search_fuzzy`.
- **Why over simpler alts:** Building from scratch is doable but you will
  spend a week on focus traps and ARIA. Algolia Autocomplete is overkill.

### T-13 — Tiptap
- **Problem:** `notes.content_json: Json` strongly suggests ProseMirror's
  document JSON. We need a stable rich-text editor with mentions (entity
  links), code blocks, task lists, and clean serialization.
- **Why fits:** Tiptap is the canonical React wrapper for ProseMirror; rich
  extension ecosystem; mention extension supports our entity-link UX out of
  the box.
- **Why over simpler alts:** Lexical (Meta) is great but mention/extension
  ecosystem is thinner. A textarea + markdown is *much* simpler — viable
  for v0, but the schema's JSON column says we already committed to a
  structured editor.

### T-15/T-16 — Monaco + E2B
- **Problem:** Browser-based IDE with real test execution and ephemeral
  isolated runtimes.
- **Why fits:** `attempt.sandbox_provider` is already a column. E2B's API is
  one POST to start a sandbox, one to exec, one to terminate; perfect for
  serverless. Monaco is the same editor as VS Code, so behavior is
  unsurprising.
- **Why over simpler alts:** WebContainers (StackBlitz) is browser-only
  (no Python). Running tests in a Vercel Function = cold start + no
  isolation. CodeMirror is lighter but loses the DX of Monaco for code
  completion.

### T-17 — Vercel AI SDK
- **Problem:** Multi-provider streaming chat with tool calls and structured
  outputs.
- **Why fits:** Already in stack direction; `generateObject` + `streamText`
  + `tool()` is the right shape for our assistant. Provider-agnostic so we
  can route OpenAI for chat, Gemini for cheap embeds, etc.
- **Why over simpler alts:** Direct OpenAI SDK loses provider portability.
  LangChain is heavier and has more abstraction debt than we want.

### T-18 — Embeddings (reuse what's already populating `embedding`)
- **Decision rule:** Whatever model populated the existing `embedding`
  columns is the one we *must* keep using until a planned re-embed. Do not
  mix dimensions.
- **Probable inference (assumption):** Gemini `text-embedding-004` (768d)
  per `aiwiki/docs/07-roadmap-slices.md` mentioning Gemini for embeddings.
  Confirm before writing query code.

### T-19 — Tavily (deferred)
- **Problem:** Sometimes the corpus won't have the answer (e.g. "what was
  released yesterday?").
- **Why fits:** Tavily provides clean, citation-friendly web search results
  ideal for AI grounding. Can be exposed as another tool to the assistant.
- **Defer because:** The corpus + RAG should be the primary value prop in
  v1. Adding web fallback risks pushing users off our platform too early.

### T-25/T-26 — PostHog + Sentry
- **Problem:** Need to know which entity types get explored, which courses
  get abandoned, which challenges fail; need to know when prod errors
  occur.
- **Why fits:** Both have first-class Next.js integrations and free tiers
  for early traffic.
- **Why over simpler alts:** Mixpanel + LogRocket = double cost, double
  cookie surface. Vercel Analytics alone won't show funnels.

### T-29 — Inngest (deferred to D6 / recommender)
- **Problem:** Long-running judging pipelines, scheduled feed refresh,
  retries on sandbox failures.
- **Why fits:** Event-driven, TypeScript-native, testable locally; fits
  perfectly into the judge → score → XP flow.
- **Why over simpler alts:** Vercel Cron + Edge Functions can do scheduled
  refresh, but lose retry semantics. BullMQ requires Redis ops.

### Why **NOT** add:
- **Algolia/Meilisearch** — Supabase RPCs already cover unified search +
  fuzzy + hybrid RAG. Adding external search would duplicate state.
- **Prisma** — Supabase types from CLI plus the Supabase JS client cover
  reads/writes; introducing Prisma forces dual-source-of-truth on the schema.
- **Redux / Zustand** — TanStack Query + URL state covers our needs; global
  client state would be a smell here.
- **GraphQL layer** — RSC + typed Supabase queries are simpler and
  performant. Re-evaluate only if a public API is needed.
- **Yjs / Liveblocks** — Real-time collab on notes is a "later" concern,
  and even then it's a dedicated feature, not a baseline.
- **Auth.js (NextAuth)** — Supabase Auth handles all our auth needs;
  introducing Auth.js would add a second identity surface.

---

## Directory layout (recommended)

```
aiengineerapp/
  app/
    (marketing)/             # public landing
    (auth)/                  # /login, /signup, /onboarding
    (app)/                   # authed shell
      layout.tsx             # top bar, left rail, right assistant drawer
      page.tsx               # personalized home feed
      explore/
      p/[slug]/              # person dossier
      o/[slug]/              # org dossier
      ...
      learn/
      courses/[slug]/
      modules/[slug]/
      challenges/
      challenges/[slug]/attempt/[attemptId]/
      notes/
      saved/
      follows/
      ask/
      settings/
    api/
      assistant/route.ts     # streaming chat + tools
      sandbox/[attemptId]/   # SSE + control endpoints
  components/
    ui/                      # shadcn/ui primitives
    entity/                  # EntityCard, EntityChip, EntityHero, EntityRelations
    notes/                   # editor, list, mention extension
    learn/                   # ModuleReader, SyllabusTree, MiniQuiz
    arena/                   # ChallengeWorkspace, EditorPane, JudgePanel
    ai/                      # AssistantDrawer, CitationCard, ToolBadge
  lib/
    supabase/                # server + client + service-role clients
    db/                      # typed query helpers per domain
    search/                  # search_all / fuzzy / match_chunks wrappers
    ai/                      # SDK setup, tools, prompts
    sandbox/                 # provider interface + E2B impl
    recommender/             # interest-vector + scoring
    analytics/               # posthog wrapper
  types/
    database.types.ts        # generated by supabase
    domain.ts                # union types for EntityKind, etc.
  scripts/                   # existing seeding/inspection scripts
```
