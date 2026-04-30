"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { FilterGroup } from "./filter-group";

export type CheckboxOption = {
  value: string;
  label: string;
  /** Optional facet count shown right-aligned. Hidden when undefined. */
  count?: number;
  /** Optional small prefix (e.g. layer code) shown before label. */
  prefix?: string;
};

export type CheckboxGroupProps = {
  title: string;
  options: readonly CheckboxOption[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Hide options with count === 0 unless they're already selected. */
  hideEmpty?: boolean;
  className?: string;
};

function toggle(arr: readonly string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function CheckboxGroup({
  title,
  options,
  selected,
  onChange,
  hideEmpty = false,
  className,
}: CheckboxGroupProps) {
  const visible = React.useMemo(() => {
    if (!hideEmpty) return options;
    return options.filter(
      (o) => (o.count ?? 1) > 0 || selected.includes(o.value),
    );
  }, [options, hideEmpty, selected]);

  if (visible.length === 0) return null;

  return (
    <FilterGroup title={title}>
      <div
        className={cn(
          "flex flex-col gap-1.5",
          visible.length > 8 && "scrollbar-none max-h-72 overflow-y-auto pr-1",
          className,
        )}
      >
        {visible.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(toggle(selected, opt.value))}
                className="border-border accent-primary h-4 w-4 rounded border"
              />
              {opt.prefix ? (
                <span className="text-muted-foreground font-mono text-[10px]">
                  {opt.prefix}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate">{opt.label}</span>
              {typeof opt.count === "number" ? (
                <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                  {opt.count.toLocaleString()}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </FilterGroup>
  );
}
