import Link from "next/link";

import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

import { EntityKindIcon } from "../explore/entity-kind-chip";

type RelationshipRow = {
  label: string;
  items: readonly EntitySummary[];
  /** Optional helper text rendered when items is empty. Defaults to a generic "—". */
  emptyHint?: string;
  hideWhenEmpty?: boolean;
};

type RelationshipSectionProps = {
  rows: readonly RelationshipRow[];
  className?: string;
  variant?: "default" | "sentences";
};

export function RelationshipSection({
  rows,
  className,
  variant = "default",
}: RelationshipSectionProps) {
  const visibleRows = rows.filter(
    (row) => !(row.hideWhenEmpty && row.items.length === 0),
  );

  if (visibleRows.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {visibleRows.map((row) => (
        <div
          key={row.label}
          className="border-border/60 flex min-w-0 flex-col gap-2 rounded-lg border bg-card/50 p-3 sm:flex-row sm:items-baseline sm:gap-4"
        >
          <div
            className={cn(
              "sm:shrink-0",
              variant === "sentences"
                ? "text-foreground text-sm font-medium sm:w-64"
                : "text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:w-44",
            )}
          >
            {row.label}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {row.items.length === 0 ? (
              <span className="text-muted-foreground text-xs italic">
                {row.emptyHint ?? "—"}
              </span>
            ) : (
              row.items.map((entity, index) => (
                <Link
                  key={`${entity.kind}:${entity.id || entity.href}:${index}`}
                  href={entity.href}
                  className="border-border/60 bg-background hover:bg-muted hover:border-border focus-visible:ring-ring/50 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:ring-3 focus-visible:outline-none"
                >
                  <EntityKindIcon
                    kind={entity.kind}
                    className="size-3 shrink-0"
                  />
                  <span className="max-w-[28ch] truncate">{entity.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
