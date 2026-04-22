"use client";

import * as React from "react";

import { peopleFacetsAction } from "@/app/actions/people-facets";
import {
  EMPTY_PEOPLE_FACETS,
  type PeopleFacets,
} from "@/lib/db/people-facets";
import type { RoleBucket } from "@/lib/search/people-roles";

export type UsePeopleFacetsArgs = {
  /** When false the hook returns the initial facets and never refetches. */
  enabled?: boolean;
  q?: string;
  tags?: readonly string[];
  roleBuckets?: readonly RoleBucket[];
  orgIds?: readonly string[];
  /** SSR-resolved facets so first paint shows real counts. */
  initial?: PeopleFacets;
  /** Debounce in ms before issuing the fetch. Defaults to 200. */
  debounceMs?: number;
};

/**
 * Debounced facet loader for /explore/people. Refetches whenever
 * `q` or any filter array changes. Out-of-order responses are
 * discarded via a request-id ref.
 */
export function usePeopleFacets({
  enabled = true,
  q,
  tags,
  roleBuckets,
  orgIds,
  initial,
  debounceMs = 200,
}: UsePeopleFacetsArgs): {
  facets: PeopleFacets;
  loading: boolean;
} {
  const [facets, setFacets] = React.useState<PeopleFacets>(
    initial ?? EMPTY_PEOPLE_FACETS,
  );
  const [loading, setLoading] = React.useState(false);
  const reqIdRef = React.useRef(0);
  const initialKeyRef = React.useRef<string | null>(
    initial
      ? JSON.stringify({
          q: q ?? "",
          tags: tags ?? [],
          roleBuckets: roleBuckets ?? [],
          orgIds: orgIds ?? [],
        })
      : null,
  );

  const trimmedQ = (q ?? "").trim();

  React.useEffect(() => {
    if (!enabled) return;
    const key = JSON.stringify({
      q: trimmedQ,
      tags: tags ?? [],
      roleBuckets: roleBuckets ?? [],
      orgIds: orgIds ?? [],
    });
    // Skip the first refetch if it would just re-fetch the SSR'd facets.
    if (initialKeyRef.current && initialKeyRef.current === key) {
      initialKeyRef.current = null;
      return;
    }
    initialKeyRef.current = null;

    const id = ++reqIdRef.current;
    setLoading(true);
    const t = setTimeout(() => {
      peopleFacetsAction({
        q: trimmedQ || undefined,
        tags: tags as string[] | undefined,
        roleBuckets: roleBuckets as string[] | undefined,
        orgIds: orgIds as string[] | undefined,
      })
        .then((next) => {
          if (id !== reqIdRef.current) return;
          setFacets(next);
          setLoading(false);
        })
        .catch((err) => {
          if (id !== reqIdRef.current) return;
          console.warn("peopleFacetsAction failed:", err);
          setLoading(false);
        });
    }, debounceMs);

    return () => clearTimeout(t);
  }, [enabled, trimmedQ, tags, roleBuckets, orgIds, debounceMs]);

  return { facets, loading };
}
