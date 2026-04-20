import Link from "next/link";

import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

import { EntityKindIcon } from "../explore/entity-kind-chip";

type RelationshipRow = {
  label: string;
  items: readonly EntitySummary[];
  /** Optional helper text rendered when items is empty. Defaults to a generic "—". */
  emptyHint?: string;
};

type RelationshipSectionProps = {
  rows: readonly RelationshipRow[];
  className?: string;
};

export function RelationshipSection({
  rows,
  className,
}: RelationshipSectionProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="border-border/60 flex flex-col gap-2 rounded-lg border bg-card/50 p-3 sm:flex-row sm:items-baseline sm:gap-4"
        >
          <div className="text-muted-foreground sm:w-44 sm:shrink-0 text-xs font-semibold tracking-wide uppercase">
            {row.label}
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {row.items.length === 0 ? (
              <span className="text-muted-foreground text-xs italic">
                {row.emptyHint ?? "—"}
              </span>
            ) : (
              row.items.map((entity) => (
                <Link
                  key={`${entity.kind}:${entity.id}`}
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
