# Next Agent Prompt: Explore Entity View Cleanup

You are working in `aiengineerapp` on the `/explore/[type]` entity views.

## Context

The People view has already been carved out from the generic explore shell and should be used as the implementation pattern.

Relevant current files:

- `app/(app)/explore/[type]/page.tsx`
- `app/(app)/explore/[type]/_explore-shell.tsx`
- `app/(app)/explore/[type]/_components/kind-tabs.tsx`
- `app/(app)/explore/[type]/_components/people/people-explore-view.tsx`
- `app/(app)/explore/[type]/_components/people/person-card.tsx`
- `app/(app)/explore/[type]/_components/people/people-filter-sidebar.tsx`
- `lib/hooks/use-explore-query.ts`
- `lib/search/explore-shared.ts`
- `types/database.types.ts`

`PeopleExploreView` currently does the desired new pattern:

- Dedicated entity-specific client view.
- Grid cards.
- `Prev` / `Next` offset pagination.
- Search and active filters.
- Entity-specific filter sidebar.
- Card-level clipped overview with `Show full overview` / `Show less`.
- Empty overview state: `No overview available yet.`

## Goal

Continue the cleanup by creating dedicated explore views/components for:

- Organizations: `/explore/organization`
- Libraries: `/explore/library`
- Papers: `/explore/paper`
- Talks: `/explore/session`
- Videos: `/explore/youtube_video`

Keep each entity type able to own its own:

- Filters
- Card
- Sort options, if available
- Result layout and pagination behavior

Do not keep adding entity-specific behavior to `_explore-shell.tsx`. Prefer moving toward small dedicated components under `app/(app)/explore/[type]/_components/<entity>/`.

## Required UX

For Organizations, Libraries, Papers, and Talks:

- Use a grid card layout similar to People.
- Use true `limit` + `offset` pagination with `Prev` and `Next`.
- Display result range, for example `Showing 1-24 of 130 organizations`.
- Preserve search, active filter chips, filters, save/follow/note state where appropriate.
- Each card should show the main overview/description clipped by default.
- Each card should have an explicit `Show full overview` / `Show less` control.
- When expanded, show an `Open profile` / `Open item` link to the entity detail route.
- If the overview/description is missing or empty, show a polished empty state like `No overview available yet.`

For Videos:

- Keep the grid/media card style.
- Do not use a visible `Load more` button.
- Automatically load more when the user scrolls near the bottom of the currently loaded results.
- Use the existing `loadMore()` behavior in `useExploreQuery` or a small wrapper hook with `IntersectionObserver`.
- Guard against duplicate loads while `loadingMore` is true.
- Preserve search, filters, sort, and active chips.

## Data Shape

Check `types/database.types.ts` before making assumptions. The relevant RPCs are:

- `explore_organizations`
- `explore_libraries`
- `explore_papers`
- `explore_sessions`
- `explore_youtube_videos`

Each accepts:

- `q?: string`
- `layers?: string[]`
- `categories?: string[]`
- `tags?: string[]`
- `sort?: string`
- `limit_count?: number`
- `offset_count?: number`

Each returns the common explore row shape:

- `entity_id`
- `slug`
- `title`
- `subtitle`
- `description`
- `image_url`
- `layer`
- `category`
- `out_tags`
- `popularity`
- `rank`
- `recent_at`
- `snippet`
- `total_count`

People has extra fields and has already been handled separately.

## Suggested Implementation Approach

1. Create shared entity-view building blocks before duplicating too much:
   - `entity-results-header.tsx` for count + sort + `Prev`/`Next`.
   - `expandable-overview.tsx` for clipped description, show more/less, empty state, and link.
   - `explore-row-mappers.ts` or local helpers to map `ExploreRow` to `EntitySummary`.

2. Add dedicated views:
   - `_components/organization/organization-explore-view.tsx`
   - `_components/library/library-explore-view.tsx`
   - `_components/paper/paper-explore-view.tsx`
   - `_components/session/session-explore-view.tsx`
   - `_components/youtube-video/video-explore-view.tsx`

3. Route by kind in `page.tsx`, similar to the People branch:
   - `person` -> `PeopleExploreView`
   - `organization` -> `OrganizationExploreView`
   - `library` -> `LibraryExploreView`
   - `paper` -> `PaperExploreView`
   - `session` -> `SessionExploreView`
   - `youtube_video` -> `VideoExploreView`

4. For Organizations/Libraries/Papers/Talks:
   - Use `useExploreQuery` with the SSR `initialOffset`.
   - Use `explore.prevPage` and `explore.nextPage`.
   - Replace rows on page navigation, not append.

5. For Videos:
   - Use `useExploreQuery`.
   - Use `explore.loadMore()` from an intersection sentinel at the bottom.
   - Render a loading skeleton or subtle `Loading more...` state when `loadingMore`.
   - Keep appending rows, not replacing them, for infinite scroll.

## Filters and Sort

Current shared filter dimensions are in `lib/search/explore-shared.ts`:

- `organization`: `layers`, `categories`, `tags`
- `library`: `layers`, `categories`, `tags`
- `paper`: `layers`, `categories`, `tags`
- `session`: `layers`, `categories`, `tags`
- `youtube_video`: `layers`, `categories`, `tags`

Current sort options are also in `lib/search/explore-shared.ts`:

- `organization`: relevance, popularity, recent, alpha
- `library`: relevance, popularity, recent, alpha
- `paper`: relevance, popularity, recent, alpha
- `session`: relevance, recent, alpha
- `youtube_video`: relevance, popularity, recent, alpha

Keep these unless the user explicitly changes them.

## Important Notes

- Do not reintroduce hover popovers for descriptions. The desired interaction is explicit expansion.
- Keep the People implementation working.
- Avoid touching unrelated dirty files in the repo.
- Preserve existing save/follow/note buttons unless a specific entity kind should not support them.
- Prefer small reusable components where they reduce duplication, but keep entity-specific views clear and easy to evolve.
- Use `ENTITY_HREF` from `types/domain.ts` to build detail links.
- Use `ExploreKindTabs` instead of duplicating tabs again.
- Run `pnpm typecheck` and `pnpm lint` after implementation.

## Acceptance Checklist

- `/explore/organization` shows grid cards with paginated `Prev` / `Next`.
- `/explore/library` shows grid cards with paginated `Prev` / `Next`.
- `/explore/paper` shows grid cards with paginated `Prev` / `Next`.
- `/explore/session` shows grid cards with paginated `Prev` / `Next`.
- `/explore/youtube_video` shows grid/media cards and auto-loads more on scroll.
- Each non-video card has explicit overview expansion.
- Missing overview text renders a friendly empty state.
- Search/filter/sort changes reset offset correctly.
- No TypeScript errors.
- No new ESLint errors.
