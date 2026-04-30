"use client";

import {
  KIND_FILTER_DIMENSIONS,
  KIND_SORT_OPTIONS,
  type ExploreKind,
  type ExploreRow,
  type ExploreSort,
} from "@/lib/search/explore-shared";
import type { ExploreFilterValue } from "@/lib/hooks/use-explore-query";

import { EntityExploreView } from "../shared/entity-explore-view";

type SessionExploreViewProps = {
  kind: Extract<ExploreKind, "session">;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset: number;
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
};

export function SessionExploreView(props: SessionExploreViewProps) {
  return (
    <EntityExploreView
      {...props}
      filterDimensions={KIND_FILTER_DIMENSIONS.session}
      sortOptions={KIND_SORT_OPTIONS.session}
      resultLabel="talks"
      emptyLabel="talks"
      openLabel="Open item"
    />
  );
}
