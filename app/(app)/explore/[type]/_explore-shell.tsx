"use client";

import Link from "next/link";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import {
  EntityKindIcon,
} from "@/components/explore/entity-kind-chip";
import {
  FilterSidebar,
  type FilterValue,
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
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import {
  EXPLORE_KIND_LABELS,
  EXPLORE_KINDS,
  EXPLORE_SORTS,
  type ExploreKind,
  type ExploreSort,
  type ExploreRow,
} from "@/lib/search/explore-shared";
import { cn } from "@/lib/utils";
import { ENTITY_HREF } from "@/types/domain";
import { exploreAction } from "@/app/actions/explore";

const PAGE_SIZE = 24;

const SORT_LABELS: Record<ExploreSort, string> = {
  relevance: "Best match",
  popularity: "Popularity",
  recent: "Recent",
  alpha: "A → Z",
};

/** Which filter dimensions each entity-kind RPC actually honours. */
const KIND_FILTER_AVAILABILITY: Record<
  ExploreKind,
  { layers: boolean; categories: boolean; tags: boolean; popularity: boolean }
> = {
  person: { layers: false, categories: false, tags: true, popularity: false },
  organization: {
    layers: true,
    categories: true,
    tags: true,
    popularity: true,
  },
  library: { layers: true, categories: true, tags: true, popularity: true },
  paper: { layers: true, categories: true, tags: true, popularity: true },
  session: { layers: true, categories: true, tags: true, popularity: false },
  youtube_video: {
    layers: true,
    categories: true,
    tags: true,
    popularity: true,
  },
};

type ExploreShellProps = {
  kind: ExploreKind;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: FilterValue;
  initialSort: ExploreSort;
};

export function ExploreShell({
  kind,
  initialRows,
  initialTotal,
  initialQuery,
  initialFilter,
  initialSort,
}: ExploreShellProps) {
  const [params, setParams] = useQueryStates({
    q: parseAsString.withDefault(initialQuery),
    sort: parseAsStringLiteral(EXPLORE_SORTS).withDefault(initialSort),
    layers: parseAsArrayOf(parseAsStringLiteral(DOMAIN_LAYERS)).withDefault(
      initialFilter.layers,
    ),
    categories: parseAsArrayOf(
      parseAsStringLiteral(CATEGORY_KEYS),
    ).withDefault(initialFilter.categories),
    tags: parseAsArrayOf(parseAsString).withDefault(initialFilter.tags),
    cursor: parseAsInteger.withDefault(0),
  });

  const [rows, setRows] = React.useState<ExploreRow[]>(initialRows);
  const [total, setTotal] = React.useState<number>(initialTotal);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const initialKey = React.useRef<string>(
    JSON.stringify({
      kind,
      q: initialQuery,
      sort: initialSort,
      layers: initialFilter.layers,
      categories: initialFilter.categories,
      tags: initialFilter.tags,
      cursor: 0,
    }),
  );
  const reqIdRef = React.useRef(0);

  const filter: FilterValue = React.useMemo(
    () => ({
      layers: params.layers as DomainLayer[],
      categories: params.categories as CategoryKey[],
      tags: params.tags,
    }),
    [params.layers, params.categories, params.tags],
  );

  const trimmedQ = params.q.trim();

  // Refetch whenever the URL state changes (skipping the very first
  // render — the page already SSR'd with the initial params).
  React.useEffect(() => {
    const key = JSON.stringify({
      kind,
      q: trimmedQ,
      sort: params.sort,
      layers: filter.layers,
      categories: filter.categories,
      tags: filter.tags,
      cursor: 0,
    });
    if (key === initialKey.current) return;
    initialKey.current = "";
    if (params.cursor !== 0) {
      setParams({ cursor: 0 });
      return;
    }
    setLoading(true);
    const id = ++reqIdRef.current;
    exploreAction({
      kind,
      q: trimmedQ || undefined,
      layers: filter.layers,
      categories: filter.categories,
      tags: filter.tags,
      sort: params.sort,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((result) => {
        if (id !== reqIdRef.current) return;
        setRows(result.rows);
        setTotal(result.total);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== reqIdRef.current) return;
        console.warn("explore failed:", err);
        setRows([]);
        setTotal(0);
        setLoading(false);
      });
  }, [
    kind,
    trimmedQ,
    params.sort,
    params.cursor,
    filter.layers,
    filter.categories,
    filter.tags,
    setParams,
  ]);

  const loadMore = React.useCallback(() => {
    setLoadingMore(true);
    const offset = rows.length;
    const id = ++reqIdRef.current;
    exploreAction({
      kind,
      q: trimmedQ || undefined,
      layers: filter.layers,
      categories: filter.categories,
      tags: filter.tags,
      sort: params.sort,
      limit: PAGE_SIZE,
      offset,
    })
      .then((result) => {
        if (id !== reqIdRef.current) return;
        setRows((prev) => [...prev, ...result.rows]);
        setTotal(result.total);
        setLoadingMore(false);
      })
      .catch((err) => {
        if (id !== reqIdRef.current) return;
        console.warn("explore loadMore failed:", err);
        setLoadingMore(false);
      });
  }, [kind, trimmedQ, filter, params.sort, rows.length]);

  const availability = KIND_FILTER_AVAILABILITY[kind];

  const onChangeFilter = (next: FilterValue) =>
    setParams({
      layers: next.layers,
      categories: next.categories,
      tags: next.tags,
    });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        <KindTabs activeKind={kind} q={params.q} />
        <SearchInput
          value={params.q}
          onChangeValue={(next) => setParams({ q: next })}
          placeholder={`Search ${EXPLORE_KIND_LABELS[kind]}…`}
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          value={filter}
          onChange={onChangeFilter}
          available={availability}
          resultCount={total}
        />
        <ResultList
          variant={kind === "youtube_video" ? "media" : "result"}
          rows={rows.map((row) => ({
            entity: {
              kind: kindToEntityKind(kind),
              id: row.entity_id,
              slug: row.slug,
              title: row.title,
              subtitle: row.subtitle,
              description: row.description,
              imageUrl: row.image_url,
              href: ENTITY_HREF[kindToEntityKind(kind)](
                row.slug ?? row.entity_id,
              ),
              tags: row.out_tags ?? undefined,
            },
            snippet: row.snippet,
          }))}
          total={total}
          loading={loading}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          emptyTitle={
            trimmedQ ? "No matches" : `No ${EXPLORE_KIND_LABELS[kind].toLowerCase()} indexed yet`
          }
          header={<ResultHeader total={total} sort={params.sort} onChange={(sort) => setParams({ sort })} />}
        />
      </div>
    </div>
  );
}

function ResultHeader({
  total,
  sort,
  onChange,
}: {
  total: number;
  sort: ExploreSort;
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
            {EXPLORE_SORTS.map((s) => (
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
  // Carry the query across kind switches so users can refine the same
  // text against different entity types.
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
            <EntityKindIcon kind={kindToEntityKind(k)} className="size-3" />
            {EXPLORE_KIND_LABELS[k]}
          </Link>
        );
      })}
    </div>
  );
}

function kindToEntityKind(k: ExploreKind) {
  return k;
}
