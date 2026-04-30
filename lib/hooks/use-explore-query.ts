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
  KIND_FILTER_DIMENSIONS,
  type FilterDimension,
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
  initialOffset?: number;
  pageSize?: number;
  lockedSort?: ExploreSort;
  filterDimensions?: readonly FilterDimension[];
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
  offset: number;
  pageSize: number;
  pageStart: number;
  pageEnd: number;
  canPrevPage: boolean;
  canNextPage: boolean;
  prevPage: () => void;
  nextPage: () => void;
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
  initialOffset = 0,
  pageSize = PAGE_SIZE,
  lockedSort,
  filterDimensions = KIND_FILTER_DIMENSIONS[kind],
}: UseExploreQueryArgs): UseExploreQuery {
  const enabledDimensions = React.useMemo(
    () => new Set<FilterDimension>(filterDimensions),
    [filterDimensions],
  );
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
    offset: parseAsInteger.withDefault(initialOffset),
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
      layers: enabledDimensions.has("layers") ? initialFilter.layers : [],
      categories: enabledDimensions.has("categories")
        ? initialFilter.categories
        : [],
      tags: enabledDimensions.has("tags") ? initialFilter.tags : [],
      roles: enabledDimensions.has("roleBuckets")
        ? initialFilter.roleBuckets
        : [],
      orgs: enabledDimensions.has("orgs") ? initialFilter.orgIds : [],
      offset: initialOffset,
    }),
  );
  const reqIdRef = React.useRef(0);

  const filter: ExploreFilterValue = React.useMemo(
    () => ({
      layers: enabledDimensions.has("layers")
        ? (params.layers as DomainLayer[])
        : [],
      categories: enabledDimensions.has("categories")
        ? (params.categories as CategoryKey[])
        : [],
      tags: enabledDimensions.has("tags") ? params.tags : [],
      roleBuckets: enabledDimensions.has("roleBuckets")
        ? (params.roles as RoleBucket[])
        : [],
      orgIds: enabledDimensions.has("orgs") ? params.orgs : [],
    }),
    [
      enabledDimensions,
      params.layers,
      params.categories,
      params.tags,
      params.roles,
      params.orgs,
    ],
  );

  const trimmedQ = params.q.trim();
  const sort = lockedSort ?? params.sort;

  React.useEffect(() => {
    const key = JSON.stringify({
      kind,
      q: trimmedQ,
      sort,
      layers: filter.layers,
      categories: filter.categories,
      tags: filter.tags,
      roles: filter.roleBuckets,
      orgs: filter.orgIds,
      offset: params.offset,
    });
    if (key === initialKey.current) return;
    initialKey.current = "";
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
      sort,
      limit: pageSize,
      offset: params.offset,
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
    sort,
    params.offset,
    filter.layers,
    filter.categories,
    filter.tags,
    filter.roleBuckets,
    filter.orgIds,
    pageSize,
    setParams,
  ]);

  const loadMore = React.useCallback(() => {
    if (loading || loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    const offset = params.offset + rows.length;
    const id = ++reqIdRef.current;
    exploreAction({
      kind,
      q: trimmedQ || undefined,
      layers: filter.layers,
      categories: filter.categories,
      tags: filter.tags,
      roleBuckets: filter.roleBuckets,
      orgIds: filter.orgIds,
      sort,
      limit: pageSize,
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
  }, [
    kind,
    trimmedQ,
    filter,
    sort,
    params.offset,
    pageSize,
    rows.length,
    total,
    loading,
    loadingMore,
  ]);

  const setFilter = React.useCallback(
    (next: ExploreFilterValue) => {
      setParams({
        layers: enabledDimensions.has("layers") ? next.layers : [],
        categories: enabledDimensions.has("categories") ? next.categories : [],
        tags: enabledDimensions.has("tags") ? next.tags : [],
        roles: enabledDimensions.has("roleBuckets") ? next.roleBuckets : [],
        orgs: enabledDimensions.has("orgs") ? next.orgIds : [],
        offset: 0,
      });
    },
    [enabledDimensions, setParams],
  );

  const patchFilter = React.useCallback(
    (patch: Partial<ExploreFilterValue>) => {
      setFilter({ ...filter, ...patch });
    },
    [filter, setFilter],
  );

  const setQ = React.useCallback(
    (next: string) => setParams({ q: next, offset: 0 }),
    [setParams],
  );

  const setSort = React.useCallback(
    (next: ExploreSort) => {
      if (lockedSort) return;
      setParams({ sort: next, offset: 0 });
    },
    [lockedSort, setParams],
  );

  const prevPage = React.useCallback(() => {
    setParams({ offset: Math.max(0, params.offset - pageSize) });
  }, [pageSize, params.offset, setParams]);

  const nextPage = React.useCallback(() => {
    setParams({ offset: params.offset + pageSize });
  }, [pageSize, params.offset, setParams]);

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

  const pageStart = total === 0 ? 0 : params.offset + 1;
  const pageEnd = Math.min(params.offset + rows.length, total);

  return {
    rows,
    total,
    loading,
    loadingMore,
    q: params.q,
    setQ,
    sort,
    setSort,
    filter,
    setFilter,
    patchFilter,
    loadMore,
    offset: params.offset,
    pageSize,
    pageStart,
    pageEnd,
    canPrevPage: params.offset > 0,
    canNextPage: params.offset + rows.length < total,
    prevPage,
    nextPage,
    resetFilters,
    activeFilterCount,
  };
}
