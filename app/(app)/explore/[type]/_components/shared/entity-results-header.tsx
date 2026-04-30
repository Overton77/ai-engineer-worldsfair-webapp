"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ExploreSort } from "@/lib/search/explore-shared";

const SORT_LABELS: Record<ExploreSort, string> = {
  relevance: "Best match",
  popularity: "Popularity",
  recent: "Recent",
  alpha: "A to Z",
};

export function EntityResultsHeader({
  label,
  total,
  pageStart,
  pageEnd,
  loading,
  canPrev,
  canNext,
  onPrev,
  onNext,
  sort,
  sortOptions = [],
  onSortChange,
  compact = false,
}: {
  label: string;
  total: number;
  pageStart: number;
  pageEnd: number;
  loading: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  sort?: ExploreSort;
  sortOptions?: readonly ExploreSort[];
  onSortChange?: (sort: ExploreSort) => void;
  compact?: boolean;
}) {
  const handleSortChange = onSortChange;
  const showSort = Boolean(sort && handleSortChange && sortOptions.length > 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {total === 0
          ? `0 ${label}`
          : `Showing ${pageStart.toLocaleString()}-${pageEnd.toLocaleString()} of ${total.toLocaleString()} ${label}`}
      </p>
      <div className="flex items-center gap-2">
        {showSort ? (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Sort</span>
            <Select
              value={sort}
              onValueChange={(value) => handleSortChange?.(value as ExploreSort)}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {SORT_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
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
