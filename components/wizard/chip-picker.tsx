"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Chip = {
  value: string;
  label: string;
  group?: string;
};

type ChipPickerProps = {
  options: readonly Chip[];
  value: readonly string[];
  onChange: (next: string[]) => void;
  min?: number;
  max?: number;
  popularValues?: readonly string[];
  groupLabels?: Record<string, string>;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
};

/**
 * Multi-select chip group with optional "Popular first" toggle and a
 * search box. Chips are grouped by `group` when group labels are
 * provided. Caller controls value (RHF form state).
 */
export function ChipPicker({
  options,
  value,
  onChange,
  min,
  max,
  popularValues,
  groupLabels,
  searchable = true,
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
}: ChipPickerProps) {
  const [query, setQuery] = React.useState("");
  const [showPopularOnly, setShowPopularOnly] = React.useState(
    Boolean(popularValues?.length),
  );
  const selected = React.useMemo(() => new Set(value), [value]);

  const visible = React.useMemo(() => {
    let pool = [...options];
    if (showPopularOnly && popularValues && popularValues.length > 0) {
      const popSet = new Set(popularValues);
      pool = pool.filter((c) => popSet.has(c.value));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      pool = pool.filter(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.value.toLowerCase().includes(q),
      );
    }
    return pool;
  }, [options, popularValues, query, showPopularOnly]);

  const grouped = React.useMemo(() => {
    if (!groupLabels) return [{ key: "_all", chips: visible }];
    const buckets = new Map<string, Chip[]>();
    for (const chip of visible) {
      const key = chip.group ?? "_other";
      const list = buckets.get(key);
      if (list) list.push(chip);
      else buckets.set(key, [chip]);
    }
    return Array.from(buckets.entries()).map(([key, chips]) => ({
      key,
      chips,
    }));
  }, [visible, groupLabels]);

  function toggle(chipValue: string) {
    const isOn = selected.has(chipValue);
    if (isOn) {
      const next = value.filter((v) => v !== chipValue);
      if (min !== undefined && next.length < min) return;
      onChange(next);
    } else {
      if (max !== undefined && value.length >= max) return;
      onChange([...value, chipValue]);
    }
  }

  return (
    <div className="space-y-3">
      {searchable ? (
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
            aria-label="Search chips"
          />
        </div>
      ) : null}

      {popularValues && popularValues.length > 0 ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {value.length} selected
            {max ? ` / ${max}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setShowPopularOnly((v) => !v)}
            className="text-primary hover:underline"
          >
            {showPopularOnly ? "Show all categories" : "Popular first"}
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {grouped.length === 0 ||
        grouped.every((g) => g.chips.length === 0) ? (
          <p className="text-muted-foreground text-sm">{emptyText}</p>
        ) : (
          grouped.map(({ key, chips }) =>
            chips.length === 0 ? null : (
              <div key={key} className="space-y-2">
                {groupLabels ? (
                  <h3 className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                    {groupLabels[key] ?? key}
                  </h3>
                ) : null}
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip) => {
                    const on = selected.has(chip.value);
                    const disabled = !on && max !== undefined && value.length >= max;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        aria-pressed={on}
                        disabled={disabled}
                        onClick={() => toggle(chip.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          disabled && !on && "opacity-50",
                        )}
                      >
                        {on ? <Check className="size-3" /> : null}
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
