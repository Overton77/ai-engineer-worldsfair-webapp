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

type OrganizationExploreViewProps = {
  kind: Extract<ExploreKind, "organization">;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset: number;
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
};

export function OrganizationExploreView(props: OrganizationExploreViewProps) {
  return (
    <EntityExploreView
      {...props}
      filterDimensions={KIND_FILTER_DIMENSIONS.organization}
      sortOptions={KIND_SORT_OPTIONS.organization}
      resultLabel="organizations"
      emptyLabel="organizations"
      openLabel="Open profile"
    />
  );
}
