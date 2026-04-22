"use client";

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { exploreAction } from "@/app/actions/explore";
import {
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import {
  EXPLORE_SORTS,
  type ExploreKind,
  type ExploreRow,
  type ExploreSort,
} from "@/lib/search/explore-shared";
import {
  ROLE_BUCKETS,
  type RoleBucket,
} from "@/lib/search/people-roles";

const PAGE_SIZE = 24;

export type ExploreFilterValue = {
  layers: DomainLayer[];
  categories: CategoryKey[];
  tags: string[];
  roleBuckets: RoleBucket[];
  orgIds: string[];
};

export type UseExploreQueryArgs = {
  kind: ExploreKind;
  initialQuery: string;
  initialSort: ExploreSort;
  initialFilter: ExploreFilterValue;
  initialRows: ExploreRow[];
  initialTotal: number;
};

export type UseExploreQuery = {
  rows: ExploreRow[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  q: string;
  setQ: (next: string) => void;
  sort: ExploreSort;
  setSort: (next: ExploreSort) => void;
  filter: ExploreFilterValue;
  setFilter: (next: ExploreFilterValue) => void;
  patchFilter: (patch: Partial<ExploreFilterValue>) => void;
  loadMore: () => void;
  resetFilters: () => void;
  /** Total number of active filter values across every dimension. */
  activeFilterCount: number;
};

const EMPTY_FILTER: ExploreFilterValue = {
  layers: [],
  categories: [],
  tags: [],
  roleBuckets: [],
  orgIds: [],
};

/**
 * Owns the URL state, fetch lifecycle, and load-more pagination for
 * an `/explore/[kind]` page. SSR'd page hydrates initial state via
 * `initial*` props; subsequent param changes trigger a guarded refetch
 * via `exploreAction` (request-id ref protects against stale responses
 * from out-of-order fetches).
 */
export function useExploreQuery({
  kind,
  initialQuery,
  initialSort,
  initialFilter,
  initialRows,
  initialTotal,
}: UseExploreQueryArgs): UseExploreQuery {
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
    roles: parseAsArrayOf(parseAsStringLiteral(ROLE_BUCKETS)).withDefault(
      initialFilter.roleBuckets,
    ),
    orgs: parseAsArrayOf(parseAsString).withDefault(initialFilter.orgIds),
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
      roles: initialFilter.roleBuckets,
      orgs: initialFilter.orgIds,
      cursor: 0,
    }),
  );
  const reqIdRef = React.useRef(0);

  const filter: ExploreFilterValue = React.useMemo(
    () => ({
      layers: params.layers as DomainLayer[],
      categories: params.categories as CategoryKey[],
      tags: params.tags,
      roleBuckets: params.roles as RoleBucket[],
      orgIds: params.orgs,
    }),
    [params.layers, params.categories, params.tags, params.roles, params.orgs],
  );

  const trimmedQ = params.q.trim();

  React.useEffect(() => {
    const key = JSON.stringify({
      kind,
      q: trimmedQ,
      sort: params.sort,
      layers: filter.layers,
      categories: filter.categories,
      tags: filter.tags,
      roles: filter.roleBuckets,
      orgs: filter.orgIds,
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
      roleBuckets: filter.roleBuckets,
      orgIds: filter.orgIds,
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
    filter.roleBuckets,
    filter.orgIds,
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
      roleBuckets: filter.roleBuckets,
      orgIds: filter.orgIds,
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

  const setFilter = React.useCallback(
    (next: ExploreFilterValue) => {
      setParams({
        layers: next.layers,
        categories: next.categories,
        tags: next.tags,
        roles: next.roleBuckets,
        orgs: next.orgIds,
      });
    },
    [setParams],
  );

  const patchFilter = React.useCallback(
    (patch: Partial<ExploreFilterValue>) => {
      setFilter({ ...filter, ...patch });
    },
    [filter, setFilter],
  );

  const setQ = React.useCallback(
    (next: string) => setParams({ q: next }),
    [setParams],
  );

  const setSort = React.useCallback(
    (next: ExploreSort) => setParams({ sort: next }),
    [setParams],
  );

  const resetFilters = React.useCallback(
    () => setFilter(EMPTY_FILTER),
    [setFilter],
  );

  const activeFilterCount =
    filter.layers.length +
    filter.categories.length +
    filter.tags.length +
    filter.roleBuckets.length +
    filter.orgIds.length;

  return {
    rows,
    total,
    loading,
    loadingMore,
    q: params.q,
    setQ,
    sort: params.sort,
    setSort,
    filter,
    setFilter,
    patchFilter,
    loadMore,
    resetFilters,
    activeFilterCount,
  };
}
