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

type VideoExploreViewProps = {
  kind: Extract<ExploreKind, "youtube_video">;
  initialRows: ExploreRow[];
  initialTotal: number;
  initialQuery: string;
  initialFilter: ExploreFilterValue;
  initialSort: ExploreSort;
  initialOffset: number;
  initialSavedKeys?: string[];
  initialFollowingKeys?: string[];
};

export function VideoExploreView(props: VideoExploreViewProps) {
  return (
    <EntityExploreView
      {...props}
      filterDimensions={KIND_FILTER_DIMENSIONS.youtube_video}
      sortOptions={KIND_SORT_OPTIONS.youtube_video}
      resultLabel="videos"
      emptyLabel="videos"
      media
      infiniteScroll
    />
  );
}
