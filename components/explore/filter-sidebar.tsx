"use client";

import { Plus, RotateCcw, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  DOMAIN_LAYERS,
  DOMAIN_LAYER_META,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import { cn } from "@/lib/utils";

export type FilterValue = {
  layers: DomainLayer[];
  categories: CategoryKey[];
  tags: string[];
};

type FilterSidebarProps = {
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  /** Whether the active entity kind has the column for this filter. Disabled groups render greyed-out. */
  available?: {
    layers?: boolean;
    categories?: boolean;
    tags?: boolean;
  };
  className?: string;
  resultCount?: number;
};

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function FilterSidebar({
  value,
  onChange,
  available = { layers: true, categories: true, tags: true },
  className,
  resultCount,
}: FilterSidebarProps) {
  const [tagDraft, setTagDraft] = React.useState("");

  const reset = () =>
    onChange({ layers: [], categories: [], tags: [] });

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (value.tags.includes(t)) {
      setTagDraft("");
      return;
    }
    onChange({ ...value, tags: [...value.tags, t] });
    setTagDraft("");
  };

  const totalActive =
    value.layers.length + value.categories.length + value.tags.length;

  return (
    <aside
      className={cn(
        "border-border/60 bg-background flex flex-col gap-5 rounded-xl border p-4",
        className,
      )}
      aria-label="Refine results"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
        {totalActive > 0 ? (
          <Button size="xs" variant="ghost" onClick={reset}>
            <RotateCcw className="size-3" />
            Reset
          </Button>
        ) : null}
      </header>

      {typeof resultCount === "number" ? (
        <p className="text-muted-foreground -mt-3 text-xs">
          {resultCount.toLocaleString()} results
        </p>
      ) : null}

      <FilterGroup
        title="Layer"
        disabled={!available.layers}
        disabledHint="Layer doesn't apply to this entity kind."
      >
        <div className="flex flex-col gap-1.5">
          {DOMAIN_LAYERS.map((layer) => {
            const meta = DOMAIN_LAYER_META[layer];
            const checked = value.layers.includes(layer);
            return (
              <label
                key={layer}
                className={cn(
                  "flex cursor-pointer items-center gap-2 text-sm",
                  !available.layers && "pointer-events-none opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!available.layers}
                  onChange={() =>
                    onChange({ ...value, layers: toggle(value.layers, layer) })
                  }
                  className="border-border h-4 w-4 rounded border accent-primary"
                />
                <span className="text-muted-foreground font-mono text-[10px]">
                  {meta.code}
                </span>
                <span>{meta.label}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup
        title="Category"
        disabled={!available.categories}
        disabledHint="Category doesn't apply to this entity kind."
      >
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {CATEGORY_KEYS.map((cat) => {
            const checked = value.categories.includes(cat);
            return (
              <label
                key={cat}
                className={cn(
                  "flex cursor-pointer items-center gap-2 text-sm",
                  !available.categories && "pointer-events-none opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!available.categories}
                  onChange={() =>
                    onChange({
                      ...value,
                      categories: toggle(value.categories, cat),
                    })
                  }
                  className="border-border h-4 w-4 rounded border accent-primary"
                />
                <span>{CATEGORY_LABELS[cat]}</span>
              </label>
            );
          })}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup
        title="Tags"
        disabled={!available.tags}
        disabledHint="Tag filter doesn't apply to this entity kind."
      >
        <div className="flex flex-col gap-2">
          {value.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        tags: value.tags.filter((x) => x !== t),
                      })
                    }
                    aria-label={`Remove tag ${t}`}
                    className="hover:text-foreground"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="flex gap-1">
            <Input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="add tag…"
              disabled={!available.tags}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="h-7 text-xs"
            />
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={addTag}
              disabled={!available.tags || !tagDraft.trim()}
              aria-label="Add tag"
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({
  title,
  children,
  disabled,
  disabledHint,
}: {
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
      {disabled && disabledHint ? (
        <p className="text-muted-foreground text-[10px] italic">
          {disabledHint}
        </p>
      ) : null}
    </section>
  );
}
