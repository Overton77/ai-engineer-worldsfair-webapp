"use client";

import { Frown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

import { EntityCard, type EntityCardVariant } from "./entity-card";

type RowExtras = {
  snippet?: string | null;
  scoreBadge?: string;
  initialSaved?: boolean;
  initialFollowing?: boolean;
};

type ResultListProps = {
  rows: Array<{ entity: EntitySummary } & RowExtras>;
  total: number;
  loading?: boolean;
  variant?: EntityCardVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Render the load-more button when there are unseen results. */
  onLoadMore?: () => void;
  loadingMore?: boolean;
  className?: string;
  /** Custom header rendered above the list (counts, sort dropdown, etc.). */
  header?: React.ReactNode;
};

/**
 * `aria-live="polite"` results region. Screen readers hear the count
 * change as the user types; visual users see snippets and skeletons.
 */
export function ResultList({
  rows,
  total,
  loading = false,
  variant = "result",
  emptyTitle = "No matches",
  emptyDescription = "Try fewer filters or a broader query.",
  onLoadMore,
  loadingMore = false,
  className,
  header,
}: ResultListProps) {
  const hasMore = rows.length < total;
  const layoutClass =
    variant === "media"
      ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      : "flex flex-col gap-3";

  return (
    <section
      aria-live="polite"
      aria-busy={loading}
      className={cn("flex flex-col gap-3", className)}
    >
      {header}

      {loading && rows.length === 0 ? (
        <div className={layoutClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
          <Frown className="text-muted-foreground size-8" />
          <p className="text-base font-medium">{emptyTitle}</p>
          <p className="text-muted-foreground text-sm">{emptyDescription}</p>
        </div>
      ) : (
        <div className={layoutClass}>
          {rows.map((row) => (
            <EntityCard
              key={`${row.entity.kind}:${row.entity.id}`}
              entity={row.entity}
              snippet={row.snippet}
              scoreBadge={row.scoreBadge}
              initialSaved={row.initialSaved}
              initialFollowing={row.initialFollowing}
              variant={variant}
            />
          ))}
        </div>
      )}

      {hasMore && onLoadMore ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : `Load more (${total - rows.length} left)`}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
