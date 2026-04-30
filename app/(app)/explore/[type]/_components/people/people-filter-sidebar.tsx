"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxGroup, type CheckboxOption } from "@/components/explore/filters/checkbox-group";
import { FilterStack } from "@/components/explore/filters/filter-group";
import { OrgPickerGroup } from "@/components/explore/filters/org-picker-group";
import type { PeopleFacets } from "@/lib/db/people-facets-shared";
import {
  ROLE_BUCKETS,
  ROLE_BUCKET_LABELS,
  type RoleBucket,
} from "@/lib/search/people-roles";
import { cn } from "@/lib/utils";

export type PeopleFilterValue = {
  roleBuckets: RoleBucket[];
  orgIds: string[];
};

export function PeopleFilterSidebar({
  value,
  onChange,
  facets,
  loading,
  resultCount,
  className,
}: {
  value: PeopleFilterValue;
  onChange: (next: PeopleFilterValue) => void;
  facets?: PeopleFacets;
  loading?: boolean;
  resultCount?: number;
  className?: string;
}) {
  const totalActive = value.roleBuckets.length + value.orgIds.length;
  const counts = new Map<string, number>(
    (facets?.role_buckets ?? []).map((r) => [r.value, r.count]),
  );
  const selectedDetails = Object.fromEntries(
    (facets?.orgs ?? []).map((o) => [
      o.id,
      {
        id: o.id,
        name: o.name,
        slug: o.slug,
        logoUrl: o.logo_url,
        count: o.count,
      },
    ]),
  );

  return (
    <aside
      className={cn(
        "border-border/60 bg-background flex flex-col gap-5 rounded-xl border p-4",
        className,
      )}
      aria-label="Refine people"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">Filters</h2>
        {totalActive > 0 ? (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onChange({ roleBuckets: [], orgIds: [] })}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
        ) : null}
      </header>

      {typeof resultCount === "number" ? (
        <p className="text-muted-foreground -mt-3 text-xs">
          {resultCount.toLocaleString()} people
        </p>
      ) : null}

      <FilterStack>
        <CheckboxGroup
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
        <OrgPickerGroup
          title="Company"
          options={(facets?.orgs ?? []).map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            logoUrl: o.logo_url,
            count: o.count,
          }))}
          selected={value.orgIds}
          selectedDetails={selectedDetails}
          onChange={(next) => onChange({ ...value, orgIds: next })}
          loading={loading}
        />
      </FilterStack>
    </aside>
  );
}
