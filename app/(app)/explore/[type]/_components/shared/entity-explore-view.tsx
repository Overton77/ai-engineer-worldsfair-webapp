"use client";

import { Frown } from "lucide-react";
import * as React from "react";

import { ActiveFiltersStrip, type ActiveFilterChip } from "@/components/explore/filters/active-filters-strip";
import { SearchInput } from "@/components/explore/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CATEGORY_LABELS,
  CategoryKeySchema,
  DOMAIN_LAYER_META,
  DomainLayerSchema,
} from "@/lib/schema/taxonomy";
import {
  useExploreQuery,
  type ExploreFilterValue,
} from "@/lib/hooks/use-explore-query";
import {
  EXPLORE_KIND_LABELS,
  type ExploreKind,
  type ExploreRow,
  type ExploreSort,
  type FilterDimension,
} from "@/lib/search/explore-shared";
import { ENTITY_HREF, type EntitySummary } from "@/types/domain";

import { ExploreKindTabs } from "../kind-tabs";
import { EntityFilterSidebar } from "./entity-filter-sidebar";
import { EntityGridCard } from "./entity-grid-card";
import { EntityResultsHeader } from "./entity-results-header";

type EntityExploreViewProps = {
  kind: ExploreKind;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset: number;
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
  filterDimensions: readonly FilterDimension[];
  sortOptions: readonly ExploreSort[];
  resultLabel: string;
  emptyLabel: string;
  openLabel?: string;
  media?: boolean;
  infiniteScroll?: boolean;
};

function rowToEntity(kind: ExploreKind, row: ExploreRow): EntitySummary {
  const layer = DomainLayerSchema.safeParse(row.layer).success
    ? DomainLayerSchema.parse(row.layer)
    : null;
  const category = CategoryKeySchema.safeParse(row.category).success
    ? CategoryKeySchema.parse(row.category)
    : null;

  return {
    kind,
    id: row.entity_id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    imageUrl: row.image_url,
    href: ENTITY_HREF[kind](row.slug ?? row.entity_id),
    tags: row.out_tags ?? undefined,
    layer,
    category,
  };
}

export function EntityExploreView({
  kind,
  initialRows,
  initialTotal,
  initialQuery,
  initialFilter,
  initialSort,
  initialOffset,
  initialSavedKeys,
  initialFollowingKeys,
  filterDimensions,
  sortOptions,
  resultLabel,
  emptyLabel,
  openLabel = "Open item",
  media = false,
  infiniteScroll = false,
}: EntityExploreViewProps) {
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
    filterDimensions,
  });

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!infiniteScroll) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry?.isIntersecting &&
          explore.canNextPage &&
          !explore.loading &&
          !explore.loadingMore
        ) {
          explore.loadMore();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [explore, infiniteScroll]);

  const chips: ActiveFilterChip[] = React.useMemo(() => {
    const out: ActiveFilterChip[] = [];
    if (filterDimensions.includes("layers")) {
      explore.filter.layers.forEach((layer) =>
        out.push({
          id: `layer:${layer}`,
          group: "Layer",
          label: DOMAIN_LAYER_META[layer].label,
          onRemove: () =>
            explore.patchFilter({
              layers: explore.filter.layers.filter((value) => value !== layer),
            }),
        }),
      );
    }
    if (filterDimensions.includes("categories")) {
      explore.filter.categories.forEach((category) =>
        out.push({
          id: `cat:${category}`,
          group: "Category",
          label: CATEGORY_LABELS[category],
          onRemove: () =>
            explore.patchFilter({
              categories: explore.filter.categories.filter(
                (value) => value !== category,
              ),
            }),
        }),
      );
    }
    if (filterDimensions.includes("tags")) {
      explore.filter.tags.forEach((tag) =>
        out.push({
          id: `tag:${tag}`,
          group: "Tag",
          label: tag,
          onRemove: () =>
            explore.patchFilter({
              tags: explore.filter.tags.filter((value) => value !== tag),
            }),
        }),
      );
    }
    return out;
  }, [explore, filterDimensions]);

  const entities = explore.rows.map((row) => {
    const key = `${kind}:${row.entity_id}`;
    return { key, entity: rowToEntity(kind, row) };
  });

  const hasActiveSearchOrFilters =
    explore.q.trim().length > 0 || explore.activeFilterCount > 0;
  const hasFilters = filterDimensions.length > 0;

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

      <div className={hasFilters ? "grid gap-6 lg:grid-cols-[260px_1fr]" : ""}>
        {hasFilters ? (
          <EntityFilterSidebar
            ariaLabel={`Refine ${EXPLORE_KIND_LABELS[kind].toLowerCase()}`}
            resultLabel={resultLabel}
            dimensions={filterDimensions}
            value={explore.filter}
            onChange={explore.setFilter}
            resultCount={explore.total}
          />
        ) : null}

        <section
          aria-live="polite"
          aria-busy={explore.loading}
          className="flex min-w-0 flex-col gap-3"
        >
          <ActiveFiltersStrip
            chips={chips}
            onClear={explore.resetFilters}
          />

          <EntityResultsHeader
            label={resultLabel}
            total={explore.total}
            pageStart={explore.pageStart}
            pageEnd={explore.pageEnd}
            loading={explore.loading}
            canPrev={explore.canPrevPage}
            canNext={explore.canNextPage}
            onPrev={explore.prevPage}
            onNext={explore.nextPage}
            sort={explore.sort}
            sortOptions={sortOptions}
            onSortChange={explore.setSort}
          />

          {explore.loading && entities.length === 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className={media ? "h-80 w-full rounded-xl" : "h-64 w-full rounded-xl"}
                />
              ))}
            </div>
          ) : entities.length === 0 ? (
            <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
              <Frown className="text-muted-foreground size-8" />
              <p className="text-base font-medium">
                {hasActiveSearchOrFilters ? "No matches" : `No ${emptyLabel} indexed yet`}
              </p>
              <p className="text-muted-foreground text-sm">
                {hasActiveSearchOrFilters
                  ? "Try removing a filter or clearing all to broaden your search."
                  : `${EXPLORE_KIND_LABELS[kind]} will appear here after they are indexed.`}
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
              {entities.map(({ key, entity }) => (
                <EntityGridCard
                  key={key}
                  entity={entity}
                  initialSaved={initialSavedSet.has(key)}
                  initialFollowing={initialFollowingSet.has(key)}
                  openLabel={openLabel}
                  media={media}
                />
              ))}
            </div>
          )}

          {infiniteScroll ? (
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          ) : entities.length > 0 ? (
            <EntityResultsHeader
              label={resultLabel}
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

          {infiniteScroll && explore.loadingMore ? (
            <p className="text-muted-foreground text-center text-sm">
              Loading more...
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
