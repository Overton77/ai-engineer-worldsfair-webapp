"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ActiveFilterChip = {
  /** Unique key (e.g. "role:engineer"). */
  id: string;
  label: string;
  /** Optional small group label shown muted before the value. */
  group?: string;
  onRemove: () => void;
};

export type ActiveFiltersStripProps = {
  chips: ActiveFilterChip[];
  onClear: () => void;
};

/**
 * Compact horizontal strip of currently-active filter pills with
 * one-click remove + a global "Clear all" affordance. Renders nothing
 * when no filters are set.
 */
export function ActiveFiltersStrip({
  chips,
  onClear,
}: ActiveFiltersStripProps) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge
          key={chip.id}
          variant="outline"
          className="gap-1 pr-1 text-xs font-normal"
        >
          {chip.group ? (
            <span className="text-muted-foreground">{chip.group}:</span>
          ) : null}
          <span className="max-w-[160px] truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="hover:text-foreground"
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        size="xs"
        variant="ghost"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  );
}
