"use client";

import * as React from "react";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { EntityKindIcon } from "@/components/explore/entity-kind-chip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

const SORTS = ["recent", "alpha"] as const;
type Sort = (typeof SORTS)[number];

const SORT_LABELS: Record<Sort, string> = {
  recent: "Recently saved",
  alpha: "A → Z",
};

type SavedToolbarProps = {
  total: number;
  /** Per-kind counts so we can show "(N)" pills for filters. */
  countsByKind: Record<string, number>;
  /** When true, the kinds reflect FollowEntityKind (adds category, domain_layer). */
  includeFollowKinds?: boolean;
};

export function SavedToolbar({
  total,
  countsByKind,
  includeFollowKinds = false,
}: SavedToolbarProps) {
  const [params, setParams] = useQueryStates({
    types: parseAsArrayOf(parseAsString).withDefault([]),
    sort: parseAsStringLiteral(SORTS).withDefault("recent"),
  });

  const allKinds = React.useMemo<readonly string[]>(() => {
    const base = [...ENTITY_KINDS].filter((k) => k !== "notes");
    return includeFollowKinds ? [...base, "category", "domain_layer"] : base;
  }, [includeFollowKinds]);

  const visibleKinds = React.useMemo(
    () => allKinds.filter((k) => (countsByKind[k] ?? 0) > 0),
    [allKinds, countsByKind],
  );

  const toggleKind = (kind: string) => {
    const next = params.types.includes(kind)
      ? params.types.filter((k) => k !== kind)
      : [...params.types, kind];
    setParams({ types: next });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1">
        <FilterPill
          label="All"
          active={params.types.length === 0}
          count={total}
          onClick={() => setParams({ types: [] })}
        />
        {visibleKinds.map((k) => (
          <FilterPill
            key={k}
            label={
              k === "category"
                ? "Categories"
                : k === "domain_layer"
                  ? "Layers"
                  : undefined
            }
            kind={
              k === "category" || k === "domain_layer"
                ? undefined
                : (k as EntityKind)
            }
            active={params.types.includes(k)}
            count={countsByKind[k] ?? 0}
            onClick={() => toggleKind(k)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Sort</span>
        <Select
          value={params.sort}
          onValueChange={(v) => setParams({ sort: v as Sort })}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function FilterPill({
  kind,
  label,
  active,
  count,
  onClick,
}: {
  kind?: EntityKind;
  label?: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="xs"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={cn("gap-1.5", count === 0 && "opacity-50")}
      disabled={count === 0 && !active}
    >
      {kind ? <EntityKindIcon kind={kind} className="size-3" /> : null}
      <span>{label ?? (kind ? labelOf(kind) : "All")}</span>
      <span className="text-muted-foreground text-[10px]">{count}</span>
    </Button>
  );
}

function labelOf(kind: EntityKind): string {
  return kind
    .split("_")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}
