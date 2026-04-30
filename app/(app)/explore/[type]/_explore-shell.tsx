"use client";

import Link from "next/link";
import * as React from "react";

import { ActiveFiltersStrip, type ActiveFilterChip } from "@/components/explore/filters/active-filters-strip";
import { EntityKindIcon } from "@/components/explore/entity-kind-chip";
import {
  FilterSidebar,
} from "@/components/explore/filter-sidebar";
import { ResultList } from "@/components/explore/result-list";
import { SearchInput } from "@/components/explore/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  DOMAIN_LAYER_META,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import {
  EXPLORE_KIND_LABELS,
  EXPLORE_KINDS,
  KIND_SORT_OPTIONS,
  type ExploreKind,
  type ExploreSort,
  type ExploreRow,
} from "@/lib/search/explore-shared";
import {
  useExploreQuery,
  type ExploreFilterValue,
} from "@/lib/hooks/use-explore-query";
import { usePeopleFacets } from "@/lib/hooks/use-people-facets";
import {
  ROLE_BUCKET_LABELS,
  type RoleBucket,
} from "@/lib/search/people-roles";
import type { PeopleFacets } from "@/lib/db/people-facets-shared";
import { cn } from "@/lib/utils";
import { ENTITY_HREF } from "@/types/domain";

const SORT_LABELS: Record<ExploreSort, string> = {
  relevance: "Best match",
  popularity: "Popularity",
  recent: "Recent",
  alpha: "A → Z",
};

type ExploreShellProps = {
  kind: ExploreKind;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset?: number;
  /** SSR-resolved save/follow state for the FIRST page of rows only. */
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
  /** SSR-resolved facets (people only). */
  initialPeopleFacets?: PeopleFacets;
};

export function ExploreShell({
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
}: ExploreShellProps) {
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
  });

  // Live facet counts for the People view, scoped by current q+filter.
  const isPeople = kind === "person";
  const facets = usePeopleFacets({
    enabled: isPeople,
    q: explore.q,
    tags: explore.filter.tags,
    roleBuckets: explore.filter.roleBuckets,
    orgIds: explore.filter.orgIds,
    initial: initialPeopleFacets,
  });

  const sortOptions = KIND_SORT_OPTIONS[kind];
  const trimmedQ = explore.q.trim();

  const chips: ActiveFilterChip[] = React.useMemo(() => {
    const out: ActiveFilterChip[] = [];
    explore.filter.layers.forEach((l) =>
      out.push({
        id: `layer:${l}`,
        group: "Layer",
        label: DOMAIN_LAYER_META[l].label,
        onRemove: () =>
          explore.patchFilter({
            layers: explore.filter.layers.filter((x) => x !== l),
          }),
      }),
    );
    explore.filter.categories.forEach((c) =>
      out.push({
        id: `cat:${c}`,
        group: "Category",
        label: CATEGORY_LABELS[c],
        onRemove: () =>
          explore.patchFilter({
            categories: explore.filter.categories.filter((x) => x !== c),
          }),
      }),
    );
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
    explore.filter.tags.forEach((t) =>
      out.push({
        id: `tag:${t}`,
        group: "Tag",
        label: t,
        onRemove: () =>
          explore.patchFilter({
            tags: explore.filter.tags.filter((x) => x !== t),
          }),
      }),
    );
    return out;
  }, [explore, facets.facets.orgs]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <KindTabs activeKind={kind} q={explore.q} />
        <SearchInput
          value={explore.q}
          onChangeValue={explore.setQ}
          placeholder={`Search ${EXPLORE_KIND_LABELS[kind]}…`}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          kind={kind}
          value={{
            layers: explore.filter.layers as DomainLayer[],
            categories: explore.filter.categories as CategoryKey[],
            tags: explore.filter.tags,
            roleBuckets: explore.filter.roleBuckets as RoleBucket[],
            orgIds: explore.filter.orgIds,
          }}
          onChange={(next) => explore.setFilter(next)}
          peopleFacets={isPeople ? facets.facets : undefined}
          peopleFacetsLoading={isPeople ? facets.loading : undefined}
          resultCount={explore.total}
        />
        <div className="flex min-w-0 flex-col gap-3">
          <ActiveFiltersStrip chips={chips} onClear={explore.resetFilters} />
          <ResultList
            variant={kind === "youtube_video" ? "media" : "result"}
            rows={explore.rows.map((row) => {
              const k = `${kind}:${row.entity_id}`;
              return {
                entity: {
                  kind,
                  id: row.entity_id,
                  slug: row.slug,
                  title: row.title,
                  subtitle: row.subtitle,
                  description: row.description,
                  imageUrl: row.image_url,
                  href: ENTITY_HREF[kind](row.slug ?? row.entity_id),
                  tags: row.out_tags ?? undefined,
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
                snippet: row.snippet,
                initialSaved: initialSavedSet.has(k),
                initialFollowing: initialFollowingSet.has(k),
              };
            })}
            total={explore.total}
            loading={explore.loading}
            loadingMore={explore.loadingMore}
            onLoadMore={explore.loadMore}
            emptyTitle={
              trimmedQ || explore.activeFilterCount > 0
                ? "No matches"
                : `No ${EXPLORE_KIND_LABELS[kind].toLowerCase()} indexed yet`
            }
            emptyHint={
              explore.activeFilterCount > 0
                ? "Try removing a filter or clearing all to broaden your search."
                : undefined
            }
            onClearFilters={
              explore.activeFilterCount > 0 ? explore.resetFilters : undefined
            }
            header={
              <ResultHeader
                total={explore.total}
                sort={explore.sort}
                sortOptions={sortOptions}
                onChange={explore.setSort}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}

function ResultHeader({
  total,
  sort,
  sortOptions,
  onChange,
}: {
  total: number;
  sort: ExploreSort;
  sortOptions: readonly ExploreSort[];
  onChange: (sort: ExploreSort) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-muted-foreground text-sm">
        {total.toLocaleString()} results
      </p>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Sort</span>
        <Select value={sort} onValueChange={(v) => onChange(v as ExploreSort)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function KindTabs({ activeKind, q }: { activeKind: ExploreKind; q: string }) {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-1">
      {EXPLORE_KINDS.map((k) => {
        const isActive = k === activeKind;
        return (
          <Link
            key={k}
            role="tab"
            aria-selected={isActive}
            href={`/explore/${k}${params}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <EntityKindIcon kind={k} className="size-3" />
            {EXPLORE_KIND_LABELS[k]}
          </Link>
        );
      })}
    </div>
  );
}
