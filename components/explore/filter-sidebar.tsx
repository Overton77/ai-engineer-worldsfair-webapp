"use client";

import { RotateCcw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  KIND_FILTER_DIMENSIONS,
  kindHasDimension,
  type ExploreKind,
  type FilterDimension,
} from "@/lib/search/explore-shared";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  DOMAIN_LAYERS,
  DOMAIN_LAYER_META,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import {
  ROLE_BUCKETS,
  ROLE_BUCKET_LABELS,
  type RoleBucket,
} from "@/lib/search/people-roles";
import type {
  OrgFacet,
  PeopleFacets,
} from "@/lib/db/people-facets-shared";
import { cn } from "@/lib/utils";

import { CheckboxGroup, type CheckboxOption } from "./filters/checkbox-group";
import { FilterStack } from "./filters/filter-group";
import { OrgPickerGroup } from "./filters/org-picker-group";
import { TagComboboxGroup } from "./filters/tag-combobox-group";

export type FilterValue = {
  layers: DomainLayer[];
  categories: CategoryKey[];
  tags: string[];
  roleBuckets: RoleBucket[];
  orgIds: string[];
};

export type FilterSidebarProps = {
  kind: ExploreKind;
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  resultCount?: number;
  /**
   * Live facet counts for the People view. When provided, the sidebar
   * shows real counts next to each option and scopes tag suggestions
   * by the current query/filter.
   */
  peopleFacets?: PeopleFacets;
  peopleFacetsLoading?: boolean;
  className?: string;
};

/** Lookup details for currently-selected orgs that may not be in the
 * top-N facet list, so the chips render with a name + logo. */
function deriveOrgDetails(
  facets: PeopleFacets | undefined,
): Record<string, OrgFacet> {
  if (!facets) return {};
  const out: Record<string, OrgFacet> = {};
  facets.orgs.forEach((o) => {
    out[o.id] = o;
  });
  return out;
}

export function FilterSidebar({
  kind,
  value,
  onChange,
  resultCount,
  peopleFacets,
  peopleFacetsLoading,
  className,
}: FilterSidebarProps) {
  const dims = KIND_FILTER_DIMENSIONS[kind];
  const hasAny = dims.length > 0;

  const totalActive =
    value.layers.length +
    value.categories.length +
    value.tags.length +
    value.roleBuckets.length +
    value.orgIds.length;

  const reset = () =>
    onChange({
      layers: [],
      categories: [],
      tags: [],
      roleBuckets: [],
      orgIds: [],
    });

  if (!hasAny) {
    return (
      <aside
        className={cn(
          "border-border/60 bg-background flex flex-col gap-2 rounded-xl border p-4",
          className,
        )}
        aria-label="Result count"
      >
        <h2 className="text-sm font-semibold tracking-tight">Results</h2>
        {typeof resultCount === "number" ? (
          <p className="text-muted-foreground text-xs">
            {resultCount.toLocaleString()} total
          </p>
        ) : null}
        <p className="text-muted-foreground mt-2 text-xs italic">
          No filters apply to this view.
        </p>
      </aside>
    );
  }

  // Build per-dimension nodes so the order is driven by `dims` (per-kind
  // declared order in KIND_FILTER_DIMENSIONS).
  const nodeFor = (dim: FilterDimension): React.ReactNode => {
    switch (dim) {
      case "layers":
        return (
          <CheckboxGroup
            key="layers"
            title="Layer"
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
        );
      case "categories":
        return (
          <CheckboxGroup
            key="categories"
            title="Category"
            selected={value.categories}
            onChange={(next) =>
              onChange({ ...value, categories: next as CategoryKey[] })
            }
            options={CATEGORY_KEYS.map(
              (cat): CheckboxOption => ({
                value: cat,
                label: CATEGORY_LABELS[cat],
              }),
            )}
          />
        );
      case "roleBuckets": {
        const counts = new Map<string, number>(
          (peopleFacets?.role_buckets ?? []).map((r) => [r.value, r.count]),
        );
        return (
          <CheckboxGroup
            key="roleBuckets"
            title="Role"
            selected={value.roleBuckets}
            onChange={(next) =>
              onChange({ ...value, roleBuckets: next as RoleBucket[] })
            }
            hideEmpty
            options={ROLE_BUCKETS.map(
              (rb): CheckboxOption => ({
                value: rb,
                label: ROLE_BUCKET_LABELS[rb],
                count: counts.get(rb),
              }),
            )}
          />
        );
      }
      case "orgs": {
        const orgs = peopleFacets?.orgs ?? [];
        const selectedDetails = deriveOrgDetails(peopleFacets);
        return (
          <OrgPickerGroup
            key="orgs"
            options={orgs.map((o) => ({
              id: o.id,
              name: o.name,
              slug: o.slug,
              logoUrl: o.logo_url,
              count: o.count,
            }))}
            selected={value.orgIds}
            selectedDetails={Object.fromEntries(
              Object.entries(selectedDetails).map(([k, o]) => [
                k,
                {
                  id: o.id,
                  name: o.name,
                  slug: o.slug,
                  logoUrl: o.logo_url,
                  count: o.count,
                },
              ]),
            )}
            onChange={(next) => onChange({ ...value, orgIds: next })}
            loading={peopleFacetsLoading}
          />
        );
      }
      case "tags": {
        const suggestions = (peopleFacets?.tags ?? []).map((t) => ({
          value: t.value,
          count: t.count,
        }));
        // For non-people kinds we don't (yet) have a facet endpoint, so
        // fall back to free-form entry.
        const isPerson = kind === "person";
        return (
          <TagComboboxGroup
            key="tags"
            suggestions={suggestions}
            selected={value.tags}
            onChange={(next) => onChange({ ...value, tags: next })}
            allowFreeform={!isPerson}
            loading={peopleFacetsLoading}
            emptyMessage={
              isPerson
                ? "No tags indexed for People yet."
                : undefined
            }
          />
        );
      }
      default:
        return null;
    }
  };

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

      <FilterStack>
        {dims
          .filter((d) => kindHasDimension(kind, d))
          .map((d) => nodeFor(d))}
      </FilterStack>
    </aside>
  );
}
