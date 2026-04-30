"use client";

import { Frown } from "lucide-react";
import * as React from "react";

import { ActiveFiltersStrip, type ActiveFilterChip } from "@/components/explore/filters/active-filters-strip";
import { SearchInput } from "@/components/explore/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PeopleFacets } from "@/lib/db/people-facets-shared";
import {
  useExploreQuery,
  type ExploreFilterValue,
} from "@/lib/hooks/use-explore-query";
import { usePeopleFacets } from "@/lib/hooks/use-people-facets";
import {
  EXPLORE_KIND_LABELS,
  type ExploreKind,
  type ExploreRow,
  type ExploreSort,
} from "@/lib/search/explore-shared";
import {
  ROLE_BUCKET_LABELS,
  type RoleBucket,
} from "@/lib/search/people-roles";
import { ENTITY_HREF } from "@/types/domain";

import { ExploreKindTabs } from "../kind-tabs";
import { PeopleFilterSidebar } from "./people-filter-sidebar";
import { PersonCard } from "./person-card";

type PeopleExploreViewProps = {
  kind: ExploreKind;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset: number;
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
  initialPeopleFacets?: PeopleFacets;
};

export function PeopleExploreView({
  kind,
  initialRows,
  initialTotal,
  initialQuery,
  initialFilter,
  initialSort,
  initialOffset,
  initialSavedKeys,
  initialFollowingKeys,
  initialPeopleFacets,
}: PeopleExploreViewProps) {
  const initialSavedSet = React.useMemo(
    () => new Set(initialSavedKeys ?? []),
    [initialSavedKeys],
  );
  const initialFollowingSet = React.useMemo(
    () => new Set(initialFollowingKeys ?? []),
    [initialFollowingKeys],
  );

  const explore = useExploreQuery({
    kind,
    initialQuery,
    initialSort,
    initialFilter,
    initialRows,
    initialTotal,
    initialOffset,
    lockedSort: initialSort,
  });

  const facets = usePeopleFacets({
    enabled: true,
    q: explore.q,
    roleBuckets: explore.filter.roleBuckets,
    orgIds: explore.filter.orgIds,
    initial: initialPeopleFacets,
  });

  const chips: ActiveFilterChip[] = React.useMemo(() => {
    const out: ActiveFilterChip[] = [];
    explore.filter.roleBuckets.forEach((r) =>
      out.push({
        id: `role:${r}`,
        group: "Role",
        label: ROLE_BUCKET_LABELS[r],
        onRemove: () =>
          explore.patchFilter({
            roleBuckets: explore.filter.roleBuckets.filter((x) => x !== r),
          }),
      }),
    );
    explore.filter.orgIds.forEach((id) => {
      const orgName =
        facets.facets.orgs.find((o) => o.id === id)?.name ?? id;
      out.push({
        id: `org:${id}`,
        group: "Company",
        label: orgName,
        onRemove: () =>
          explore.patchFilter({
            orgIds: explore.filter.orgIds.filter((x) => x !== id),
          }),
      });
    });
    return out;
  }, [explore, facets.facets.orgs]);

  const people = explore.rows.map((row) => {
    const key = `${kind}:${row.entity_id}`;
    return {
      key,
      person: {
        kind,
        id: row.entity_id,
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle,
        description: row.description,
        imageUrl: row.image_url,
        href: ENTITY_HREF[kind](row.slug ?? row.entity_id),
        org:
          row.org_id && row.org_name
            ? {
                id: row.org_id,
                name: row.org_name,
                logoUrl: null,
              }
            : null,
        roleBucket: (row.role_bucket as RoleBucket | null) ?? null,
      },
    };
  });

  const hasActiveSearchOrFilters =
    explore.q.trim().length > 0 || explore.activeFilterCount > 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <ExploreKindTabs activeKind={kind} q={explore.q} />
        <SearchInput
          value={explore.q}
          onChangeValue={explore.setQ}
          placeholder={`Search ${EXPLORE_KIND_LABELS[kind]}...`}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <PeopleFilterSidebar
          value={{
            roleBuckets: explore.filter.roleBuckets as RoleBucket[],
            orgIds: explore.filter.orgIds,
          }}
          onChange={(next) =>
            explore.patchFilter({
              layers: [],
              categories: [],
              tags: [],
              roleBuckets: next.roleBuckets,
              orgIds: next.orgIds,
            })
          }
          facets={facets.facets}
          loading={facets.loading}
          resultCount={explore.total}
        />

        <section
          aria-live="polite"
          aria-busy={explore.loading}
          className="flex min-w-0 flex-col gap-3"
        >
          <ActiveFiltersStrip
            chips={chips}
            onClear={explore.resetFilters}
          />

          <PeopleResultsHeader
            total={explore.total}
            pageStart={explore.pageStart}
            pageEnd={explore.pageEnd}
            loading={explore.loading}
            canPrev={explore.canPrevPage}
            canNext={explore.canNextPage}
            onPrev={explore.prevPage}
            onNext={explore.nextPage}
          />

          {explore.loading && people.length === 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : people.length === 0 ? (
            <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
              <Frown className="text-muted-foreground size-8" />
              <p className="text-base font-medium">
                {hasActiveSearchOrFilters ? "No matches" : "No people indexed yet"}
              </p>
              <p className="text-muted-foreground text-sm">
                {hasActiveSearchOrFilters
                  ? "Try removing a filter or clearing all to broaden your search."
                  : "People will appear here after they are indexed."}
              </p>
              {hasActiveSearchOrFilters ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={explore.resetFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {people.map(({ key, person }) => (
                <PersonCard
                  key={key}
                  person={person}
                  initialSaved={initialSavedSet.has(key)}
                  initialFollowing={initialFollowingSet.has(key)}
                />
              ))}
            </div>
          )}

          {people.length > 0 ? (
            <PeopleResultsHeader
              total={explore.total}
              pageStart={explore.pageStart}
              pageEnd={explore.pageEnd}
              loading={explore.loading}
              canPrev={explore.canPrevPage}
              canNext={explore.canNextPage}
              onPrev={explore.prevPage}
              onNext={explore.nextPage}
              compact
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function PeopleResultsHeader({
  total,
  pageStart,
  pageEnd,
  loading,
  canPrev,
  canNext,
  onPrev,
  onNext,
  compact = false,
}: {
  total: number;
  pageStart: number;
  pageEnd: number;
  loading: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {total === 0
          ? "0 people"
          : `Showing ${pageStart.toLocaleString()}-${pageEnd.toLocaleString()} of ${total.toLocaleString()} people`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={onPrev}
          disabled={!canPrev || loading}
        >
          Prev
        </Button>
        <Button
          type="button"
          variant="outline"
          size={compact ? "xs" : "sm"}
          onClick={onNext}
          disabled={!canNext || loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
