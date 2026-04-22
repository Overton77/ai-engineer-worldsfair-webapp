import { notFound } from "next/navigation";

import {
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import { getSaveFollowState } from "@/lib/db/save-follow-state";
import {
  EMPTY_PEOPLE_FACETS,
  getPeopleFacets,
} from "@/lib/db/people-facets";
import {
  EXPLORE_KIND_LABELS,
  EXPLORE_KINDS,
  EXPLORE_SORTS,
  KIND_DEFAULT_SORT_NO_Q,
  KIND_SORT_OPTIONS,
  exploreEntities,
  type ExploreKind,
  type ExploreSort,
} from "@/lib/search/explore";
import {
  ROLE_BUCKETS,
  type RoleBucket,
} from "@/lib/search/people-roles";

import { ExploreShell } from "./_explore-shell";

const PAGE_SIZE = 24;

type ExplorePageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const KIND_SET = new Set<string>(EXPLORE_KINDS);
const LAYER_SET = new Set<string>(DOMAIN_LAYERS);
const CATEGORY_SET = new Set<string>(CATEGORY_KEYS);
const SORT_SET = new Set<string>(EXPLORE_SORTS);
const ROLE_SET = new Set<string>(ROLE_BUCKETS);

function parseStringArray(raw: unknown, whitelist?: ReadonlySet<string>): string[] {
  if (typeof raw !== "string" || !raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => (whitelist ? whitelist.has(s) : true));
}

export async function generateMetadata({ params }: ExplorePageProps) {
  const { type } = await params;
  if (!KIND_SET.has(type)) return { title: "Explore" };
  return { title: `Explore ${EXPLORE_KIND_LABELS[type as ExploreKind]}` };
}

export default async function ExploreTypePage({
  params,
  searchParams,
}: ExplorePageProps) {
  const { type } = await params;
  if (!KIND_SET.has(type)) notFound();
  const kind = type as ExploreKind;

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const layers = parseStringArray(sp.layers, LAYER_SET) as DomainLayer[];
  const categories = parseStringArray(
    sp.categories,
    CATEGORY_SET,
  ) as CategoryKey[];
  const tags = parseStringArray(sp.tags);
  const roleBuckets = parseStringArray(sp.roles, ROLE_SET) as RoleBucket[];
  const orgIds = parseStringArray(sp.orgs);
  const trimmedQ = q.trim();

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const allowedSorts = new Set<string>(KIND_SORT_OPTIONS[kind]);
  let sort: ExploreSort;
  if (SORT_SET.has(sortRaw) && allowedSorts.has(sortRaw)) {
    sort = sortRaw as ExploreSort;
  } else if (trimmedQ) {
    sort = "relevance";
  } else {
    sort = KIND_DEFAULT_SORT_NO_Q[kind];
  }

  // SSR-fetch the result page + (for People) the facet counts in
  // parallel so first paint shows real numbers next to each filter.
  const [result, peopleFacets] = await Promise.all([
    exploreEntities(kind, {
      q: trimmedQ || undefined,
      layers,
      categories,
      tags,
      roleBuckets,
      orgIds,
      sort,
      limit: PAGE_SIZE,
      offset: 0,
    }).catch((err) => {
      console.warn(`exploreEntities ${kind} failed:`, err);
      return { rows: [], total: 0 };
    }),
    kind === "person"
      ? getPeopleFacets({
          q: trimmedQ || undefined,
          tags,
          roleBuckets,
          orgIds,
        }).catch((err) => {
          console.warn("getPeopleFacets failed:", err);
          return EMPTY_PEOPLE_FACETS;
        })
      : Promise.resolve(undefined),
  ]);

  const ssState = await getSaveFollowState(
    result.rows.map((r) => ({ kind, id: r.entity_id })),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <ExploreShell
        kind={kind}
        initialRows={result.rows}
        initialTotal={result.total}
        initialQuery={q}
        initialFilter={{ layers, categories, tags, roleBuckets, orgIds }}
        initialSort={sort}
        initialSavedKeys={Array.from(ssState.saved)}
        initialFollowingKeys={Array.from(ssState.following)}
        initialPeopleFacets={peopleFacets}
      />
    </div>
  );
}
