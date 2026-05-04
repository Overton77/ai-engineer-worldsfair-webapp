# AI Engineer App

`aiengineerapp` is the production web app for an AI engineering knowledge and learning product. It turns the AI Engineer corpus - talks, speakers, companies, libraries, repos, papers, videos, notes, course modules, and challenges - into an authenticated Next.js application backed by Supabase.

Live deployment: https://ai-engineer-worldsfair-webapp.vercel.app/video/k8cnVCMYmNc

The app currently includes:

- An authenticated product shell with onboarding, command palette, search, saved items, follows, notes, settings, notifications, and entity dossiers.
- Explore and search surfaces for people, organizations, libraries, papers, sessions, videos, events, and related corpus entities.
- Dossier pages for entity detail routes such as `/p/[slug]`, `/o/[slug]`, `/talk/[slug]`, `/video/[id]`, `/lib/[slug]`, `/paper/[slug]`, and `/event/[slug]`.
- A learner product with `/learn`, `/courses`, `/courses/[slug]`, `/modules`, `/modules/[moduleSlug]`, course-scoped module readers, progress tracking, mini-quizzes, XP awards, and coming-soon challenge/capstone surfaces.
- A vault publishing pipeline that projects Markdown courseware and corpus artifacts from `../aiwiki/` into Supabase.

The app assistant, challenges, and capstone projects are coming soon. The retrieval layer and `chunk` search infrastructure exist, but the full chat UI/API and challenge runtime are not shipped yet.

## Repository Map

This README lives in `aiengineerapp/`, but the app depends on a few sibling folders:

- `aiengineerapp/` - Next.js 16 App Router app, TypeScript, React 19, Tailwind 4, Supabase SSR, Vercel integrations, Vitest, and content publishing scripts.
- `../supabase/` - Supabase CLI project with local config, seed data, and migrations. App `db:*` scripts run the CLI with `--workdir ..`.
- `../aiwiki/` - AI intelligence vault and planning docs. This is the source-of-truth content workspace for buckets, video projects, course modules, courses, challenges, and pipeline docs.
- `../pyenv/` - older Python workspace for AI Engineer ingestion experiments, Sessionize/YouTube exports, Selenium scraping, LLM enrichment, and a legacy Neo4j GraphQL API.

## Tech Stack

- Next.js `16.2.2` App Router with Next Proxy, React Compiler, and React `19.2.4`.
- pnpm `10.13.1`.
- Tailwind CSS 4 with shadcn/Radix/Base UI style primitives.
- Supabase Auth, Postgres, Storage, RLS, generated TypeScript database types, pgvector, and full-text search.
- `@supabase/ssr` for server/browser auth clients.
- TipTap for notes.
- TanStack Query and `nuqs` for client state/query-state surfaces.
- Vercel AI SDK packages, `@cursor/sdk`, Vercel Blob, and Vercel Queue.
- Vitest + React Testing Library for unit/component coverage.

## Getting Started

Install dependencies from the app directory:

```bash
cd aiengineerapp
pnpm install
```

Create `aiengineerapp/.env` with at least the Supabase public URL and anon key:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

For local Supabase development, start the root Supabase project through the app scripts:

```bash
pnpm db:start
pnpm db:reset
pnpm db:types:local
```

Then run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`. Unauthenticated users are redirected to `/welcome` or `/login`; authenticated users are gated through onboarding until their onboarding status is complete or skipped.

## Environment Variables

Required for normal app boot:

- `NEXT_PUBLIC_SUPABASE_URL` - browser/server Supabase URL. `SUPABASE_URL` is also accepted by helper code.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - browser-safe Supabase anon key. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, and `SUPABASE_PUBLISHABLE_KEY` are fallback names.

Common server-side or operational variables:

- `SUPABASE_SERVICE_ROLE_KEY` - required by admin scripts, vault upserts, backfills, and service-role operations.
- `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING` - used by SQL utility scripts.
- `AWS_BEARER_TOKEN_BEDROCK` - required for retrieval embeddings through Bedrock Cohere.
- `AWS_REGION` - optional, defaults to `us-east-1`.
- `EMBEDDING_MODEL_COHERE` - optional, defaults to `cohere.embed-v4:0`.
- `BLOB_READ_WRITE_TOKEN` - required for Vercel Blob uploads.
- `RECOMMENDATION_DRAIN_SECRET` - protects the admin recommendation drain route.
- `CURSOR_API_KEY`, `CURSOR_MODEL`, `CURSOR_SDK_SANDBOX` - used by Cursor SDK smoke scripts.

Optional integrations:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`
- `POSTHOG_KEY`
- `SENTRY_DSN`
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`

Do not commit `.env` files. They are ignored by `.gitignore`.

## Scripts

Core app scripts:

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm typecheck    # TypeScript, excluding scripts/**
pnpm test         # Vitest run
pnpm test:watch   # Vitest watch mode
```

Supabase scripts:

```bash
pnpm db:start
pnpm db:stop
pnpm db:reset
pnpm db:push
pnpm db:pull
pnpm db:diff
pnpm db:link
pnpm db:migration:new
pnpm db:migration:list
pnpm db:types
pnpm db:types:local
```

Content publishing shortcuts:

```bash
pnpm vault:upsert-modules:agent-orchestration
pnpm vault:upsert-courses:agent-orchestration
pnpm vault:upsert:agent-orchestration-skills-mini
```

Other useful scripts:

```bash
pnpm learning:upload-image
pnpm cursor:models
pnpm cursor:smoke
pnpm cursor:workflow-smoke
```

Most operational scripts live under `scripts/` and run with `pnpm exec tsx`. `tsconfig.json` excludes `scripts/**` from the main app typecheck, so script-specific typing/runtime checks need to happen when running those scripts.

## App Architecture

Important App Router areas:

- `app/layout.tsx` - global fonts, metadata, theme provider, `NuqsAdapter`, and toaster.
- `app/(marketing)/welcome` - public landing page.
- `app/(auth)/login`, `app/(auth)/auth/callback`, `app/(auth)/logout` - auth entry points.
- `app/(onboarding)/onboarding/[step]` - onboarding wizard.
- `app/(app)/layout.tsx` - authenticated product shell.
- `app/(app)/page.tsx` - signed-in home.
- `app/(app)/explore` and `app/(app)/explore/[type]` - typed explore/search surfaces.
- `app/(app)/search` - lexical, semantic, and hybrid search UI.
- `app/(app)/saved`, `app/(app)/follows`, `app/(app)/notes` - user library features.
- `app/(app)/learn`, `app/(app)/courses`, `app/(app)/modules`, `app/(app)/challenges` - learner surfaces.
- `app/(app)/p`, `o`, `talk`, `video`, `lib`, `paper`, `event` - entity dossier routes.
- `app/actions/` - cross-cutting server actions for search, explore, palette, notes, saves, follows, notifications, and related workflows.
- `app/api/queues/recompute-recommendations` - Vercel Queue callback for recommendation recomputation.

Important component folders:

- `components/ui/` - generic UI primitives.
- `components/shell/` - app chrome, rails, top bar, user menu, notifications, command trigger, XP/streak UI.
- `components/explore/` - filters, cards, result lists, and typed explore UI pieces.
- `components/dossier/` - entity hero, tabs, corpus, relationships, media, and notes affordances.
- `components/notes/` - TipTap editor, note shells, mention picker, quick drawer, video notes, and entity notes panel.
- `components/learn/`, `components/courses/`, `components/modules/`, `components/challenges/` - learner dashboard, catalogs, course detail, module reader, quiz/completion UI, and challenge previews.
- `components/save-follow/`, `components/saves/`, `components/command-palette/`, `components/wizard/`, `components/settings/`, `components/brand/` - focused product feature components.

Important library folders:

- `lib/auth/` - `requireUser()`, optional user lookup, and ownership assertions.
- `lib/supabase/` - server, browser, admin, env, and proxy/session helpers.
- `lib/db/` - Supabase data-access helpers for entities, profiles, stats, notes, saves, follows, learner progress, recommendations, and related features.
- `lib/search/` - lexical search, fuzzy search, typed explore, and chunk search actions.
- `lib/retrieval/` - Bedrock Cohere embedder, hybrid retrieval adapter, filters, and context formatting for RAG.
- `lib/learn/` - module quiz logic, completion actions, asset parsing, and content immutability checks.
- `lib/notes/` - TipTap note types, text derivation, URL state, and mention extensions.
- `lib/schema/` - shared entity-kind and taxonomy constants.
- `types/domain.ts` - app-level domain types and canonical entity URL mapping.
- `types/database.types.ts` - generated Supabase types. Do not edit by hand.

## Auth and Security Model

`proxy.ts` is the Next 16 Proxy. It refreshes Supabase auth cookies on requests and handles UX redirects for public, protected, and onboarding routes.

Authorization should not rely on redirects alone. Protected Server Components, Server Actions, and Route Handlers should use `requireUser()` from `lib/auth/require-user.ts`, and database access is ultimately constrained by Supabase RLS policies.

Supabase client helpers:

- `lib/supabase/server.ts` - Server Component/Action client.
- `lib/supabase/browser.ts` - browser client.
- `lib/supabase/admin.ts` - service-role client for server-only/admin work.
- `lib/supabase/middleware.ts` - proxy session refresh helpers.

## Supabase and Data Model

The root `../supabase/` folder contains:

- `migrations/` - schema history.
- `seed.sql` - local seed data.
- `config.toml` - local Supabase stack configuration.

The schema models:

- Core corpus entities: people, organizations, events, sessions, YouTube videos, libraries, repos, products, papers, reports, and news items.
- Corpus relationships: speakers, appearances, sponsorships, employment/founder/CEO links, library and paper mentions, repo/library links, and event/session/video joins.
- User product data: profiles, notes, saved items, follows, notifications, stats, interaction events, and recommendations.
- Learner data: course modules, courses, course enrollments, course-scoped module completion, standalone module completion, learning assets, challenges, attempts, and XP/score events.
- Retrieval data: `chunk` rows with `vector(1536)`, generated FTS, metadata JSONB, and the `match_chunks` RPC for hybrid vector + full-text retrieval.

When changing schema:

1. Add a new migration under `../supabase/migrations/`.
2. Run the migration locally with `pnpm db:reset` or the appropriate Supabase CLI command.
3. Regenerate types with `pnpm db:types:local` or `pnpm db:types`.
4. Commit the migration and regenerated `types/database.types.ts` together.

## Retrieval and Assistant Infrastructure

The retrieval layer is centered on `lib/retrieval/search.ts` and `lib/retrieval/embedder.ts`.

- `embedQuery()` and `embedDocuments()` call Bedrock Runtime with Cohere `cohere.embed-v4:0`.
- Embeddings are fixed at `1536` dimensions to match Supabase vector columns.
- `search()` calls the `match_chunks` RPC and combines HNSW vector search with Postgres FTS using reciprocal rank fusion.
- `formatHitsAsContext()` formats chunk hits into citation-ready LLM context.

The visible `/ask` route is intentionally a placeholder until the streaming assistant UI and route are wired to this retrieval layer.

## Vault Content Pipeline

The current content pipeline uses `../aiwiki/ai-intelligence-vault/ai-intelligence` as the default vault root. `scripts/_shared/vault.ts` resolves that path from the app directory and provides shared Markdown/front-matter parsing, content hashing, argument parsing, and service-role Supabase access.

Current vault scripts include:

- `scripts/upsert-entities.ts` - project vault entities into Supabase.
- `scripts/upsert-link-tables.ts` - refresh relationship/link tables.
- `scripts/upsert-chunks.ts` - write chunk rows for retrieval.
- `scripts/upsert-modules.ts` - publish `course/modules/<slug>/module.md` into `course_module`.
- `scripts/upsert-courses.ts` - publish `course/courses/<slug>/course.md` into `course`.
- `scripts/upsert-challenges.ts` - publish `course/challenges/<slug>/challenge.md` into `challenge`.
- `scripts/publish-bucket.ts` - orchestrate bucket publishing in order.
- `scripts/backfill-search-text-and-embeddings.ts`, `scripts/backfill-video-categories.ts`, `scripts/normalize-profile-tags.ts` - maintenance backfills.
- `scripts/inspect-corpus.ts`, `scripts/export-corpus-snapshot.ts`, `scripts/smoke-query.ts`, `scripts/check-embedder.ts`, `scripts/apply-sql.ts` - operational helpers.

The `agent_orchestration` bucket is the current pilot bucket. It contains a published mini-course (`agent-orchestration-skills-mini`), three published modules, a drafted capstone challenge, and indexed chunks from the first fully processed video project.

Run bucket publishing with `tsx` directly when you need flags:

```bash
pnpm exec tsx scripts/publish-bucket.ts --bucket agent_orchestration --dry-run
pnpm exec tsx scripts/publish-bucket.ts --bucket agent_orchestration
```

Publishing rules worth preserving:

- Published same-version course/module semantic drift should fail; bump `version` instead.
- Published modules/courses are staged through review/publish states while composition links are refreshed.
- Module upserts parse `assets:` front matter, upload owned files to the private `learning-assets` Supabase Storage bucket, extract text from text-like assets, and link them through `module_uses_artifact`.
- Required asset extraction failures block publish; non-required failures warn and continue.

## `aiwiki/` Context

`../aiwiki/` is both a content vault and an architectural notebook for the corpus pipeline.

Useful docs:

- `../aiwiki/docs/03-taxonomy.md` - bucket/category taxonomy.
- `../aiwiki/docs/04-pipeline-stages.md` - end-to-end pipeline from YouTube catalog to chunks, courses, and challenges.
- `../aiwiki/docs/08-data-model.md` - schema planning/current-model notes.
- `../aiwiki/ai-intelligence-vault/ai-intelligence/01_buckets/agent_orchestration/_bucket.md` - the pilot bucket manifest.

The vault pipeline is designed to be re-runnable and mostly idempotent. The intended flow is:

1. Start with raw/video/catalog data.
2. Categorize and group content into buckets.
3. Enrich selected projects with transcripts, summaries, metadata, and entity extraction.
4. Promote canonical entities and links.
5. Chunk and embed corpus artifacts.
6. Author modules, courses, and challenges from the bucket.
7. Publish the bucket into Supabase for the app.

## Archived Python Ingestion Context

`../pyenv/` predates much of the current Supabase/vault publishing flow. Treat it as historical and useful context, not the primary app runtime.

The main ingestion package is `../pyenv/ingestionservices/`. Its README describes a Sessionize/AI Engineer World's Fair pipeline:

1. Fetch remote Sessionize and `ai.engineer` JSON with `python -m ingestionservices.sources.fetch_remote_json`.
2. Combine session and speaker data into CSVs with `python -m ingestionservices.sessions_speakers.combine_to_sessions_speakers`.
3. Scrape AI Engineer World's Fair speaker pages with Selenium via `python -m ingestionservices.scraping.worlds_fair_scraper --event default` or `--event paris`.
4. Enrich combined speaker/session rows with scraped LinkedIn and AI Engineer URLs.
5. Export all videos from the official YouTube channel with `python -m ingestionservices.youtube.channel_to_json`.
6. Run a LangChain/LangGraph LLM enrichment pass to infer person-organization metadata and produce `data/prepared/*.csv`.
7. Optionally ingest/link the results into Neo4j with `ingestionservices/neo4j/*`.

That older path used Python `>=3.12`, FastAPI, Strawberry GraphQL, Neo4j, pandas, Selenium, YouTube Data API, LangChain, OpenAI, and related tools. The older `pyenv/src/` GraphQL API targeted a local Neo4j database. If you need data from this flow today, the CSV and JSON artifacts under `pyenv/ingestionservices/data/` are the handoff points; the production app now reads from Supabase.

The `aiwiki/docs/04-pipeline-stages.md` docs also refer to a `pythonenv/` scripts workspace for newer offline cataloging and enrichment experiments. In this checkout, the relevant historical Python workspace available to inspect is `pyenv/`.

## Testing and Quality

Run the main checks from `aiengineerapp/`:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Vitest is configured in `vitest.config.ts` with `jsdom`, `vitest.setup.ts`, React plugin support, and tests under:

- `lib/**/*.test.{ts,tsx}`
- `components/**/*.test.{ts,tsx}`

Because scripts are excluded from the main TypeScript project, test or run high-risk script changes explicitly with `pnpm exec tsx ...` or focused tests.

## Development Notes

- Prefer imports through `@/*`; `tsconfig.json` maps `@` to the app root.
- Keep route `page.tsx` files thin. Fetch in Server Components or server actions, then compose UI from `components/`.
- Reusable UI belongs in `components/`; route-private heavy client UI can live beside the route.
- Do not manually edit `types/database.types.ts`; regenerate it from Supabase.
- Keep RLS enabled for user-owned or unpublished data.
- Use service-role scripts only for trusted operational tasks.
- Do not commit secrets, OAuth credentials, Supabase service keys, local tokens, or generated private ingestion artifacts.
