"use client";

import { RotateCcw } from "lucide-react";

import { CheckboxGroup, type CheckboxOption } from "@/components/explore/filters/checkbox-group";
import { FilterStack } from "@/components/explore/filters/filter-group";
import { TagComboboxGroup } from "@/components/explore/filters/tag-combobox-group";
import { Button } from "@/components/ui/button";
import type { ExploreFilterValue } from "@/lib/hooks/use-explore-query";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  DOMAIN_LAYERS,
  DOMAIN_LAYER_META,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import type { FilterDimension } from "@/lib/search/explore-shared";
import { cn } from "@/lib/utils";

export function EntityFilterSidebar({
  ariaLabel,
  resultLabel,
  dimensions,
  value,
  onChange,
  resultCount,
  className,
}: {
  ariaLabel: string;
  resultLabel: string;
  dimensions: readonly FilterDimension[];
  value: ExploreFilterValue;
  onChange: (next: ExploreFilterValue) => void;
  resultCount?: number;
  className?: string;
}) {
  const hasFilters = dimensions.length > 0;
  if (!hasFilters) return null;

  const totalActive =
    (dimensions.includes("layers") ? value.layers.length : 0) +
    (dimensions.includes("categories") ? value.categories.length : 0) +
    (dimensions.includes("tags") ? value.tags.length : 0);

  const reset = () =>
    onChange({
      layers: [],
      categories: [],
      tags: [],
      roleBuckets: [],
      orgIds: [],
    });

  return (
    <aside
      className={cn(
        "border-border/60 bg-background flex flex-col gap-5 rounded-xl border p-4",
        className,
      )}
      aria-label={ariaLabel}
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
          {resultCount.toLocaleString()} {resultLabel}
        </p>
      ) : null}

      <FilterStack>
        {dimensions.includes("layers") ? (
          <CheckboxGroup
            title="Domain layer"
            selected={value.layers}
            onChange={(next) =>
              onChange({ ...value, layers: next as DomainLayer[] })
            }
            options={DOMAIN_LAYERS.map(
              (layer): CheckboxOption => ({
                value: layer,
                label: DOMAIN_LAYER_META[layer].label,
                prefix: DOMAIN_LAYER_META[layer].code,
              }),
            )}
          />
        ) : null}

        {dimensions.includes("categories") ? (
          <CheckboxGroup
            title="Category"
            selected={value.categories}
            onChange={(next) =>
              onChange({ ...value, categories: next as CategoryKey[] })
            }
            options={CATEGORY_KEYS.map(
              (category): CheckboxOption => ({
                value: category,
                label: CATEGORY_LABELS[category],
              }),
            )}
          />
        ) : null}

        {dimensions.includes("tags") ? (
          <TagComboboxGroup
            suggestions={[]}
            selected={value.tags}
            onChange={(next) => onChange({ ...value, tags: next })}
            allowFreeform
          />
        ) : null}
      </FilterStack>
    </aside>
  );
}
