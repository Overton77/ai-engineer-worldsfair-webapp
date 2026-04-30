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

type LibraryExploreViewProps = {
  kind: Extract<ExploreKind, "library">;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset: number;
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
};

export function LibraryExploreView(props: LibraryExploreViewProps) {
  return (
    <EntityExploreView
      {...props}
      filterDimensions={KIND_FILTER_DIMENSIONS.library}
      sortOptions={KIND_SORT_OPTIONS.library}
      resultLabel="libraries"
      emptyLabel="libraries"
    />
  );
}
