"use client";

import Link from "next/link";

import { EntityKindIcon } from "@/components/explore/entity-kind-chip";
import {
  EXPLORE_KIND_LABELS,
  EXPLORE_KINDS,
  type ExploreKind,
} from "@/lib/search/explore-shared";
import { cn } from "@/lib/utils";

export function ExploreKindTabs({
  activeKind,
  q,
}: {
  activeKind: ExploreKind;
  q: string;
}) {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-1">
      {EXPLORE_KINDS.map((k) => {
        const isActive = k === activeKind;
        return (
          <Link
            key={k}
            role="tab"
            aria-selected={isActive}
            href={`/explore/${k}${params}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <EntityKindIcon kind={k} className="size-3" />
            {EXPLORE_KIND_LABELS[k]}
          </Link>
        );
      })}
    </div>
  );
}
