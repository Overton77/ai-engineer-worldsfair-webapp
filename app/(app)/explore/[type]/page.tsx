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
  KIND_FILTER_DIMENSIONS,
  KIND_SORT_OPTIONS,
  exploreEntities,
  type ExploreKind,
  type ExploreSort,
} from "@/lib/search/explore";
import {
  ROLE_BUCKETS,
  type RoleBucket,
} from "@/lib/search/people-roles";

import { LibraryExploreView } from "./_components/library/library-explore-view";
import { OrganizationExploreView } from "./_components/organization/organization-explore-view";
import { PaperExploreView } from "./_components/paper/paper-explore-view";
import { PeopleExploreView } from "./_components/people/people-explore-view";
import { SessionExploreView } from "./_components/session/session-explore-view";
import { VideoExploreView } from "./_components/youtube-video/video-explore-view";

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

function parseOffset(raw: unknown): number {
  if (typeof raw !== "string") return 0;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
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
  const offset = parseOffset(sp.offset);
  const trimmedQ = q.trim();
  const isPeople = kind === "person";
  const filterDimensions = KIND_FILTER_DIMENSIONS[kind];
  const effectiveLayers = filterDimensions.includes("layers") ? layers : [];
  const effectiveCategories = filterDimensions.includes("categories")
    ? categories
    : [];
  const effectiveTags = filterDimensions.includes("tags") ? tags : [];
  const effectiveRoleBuckets = filterDimensions.includes("roleBuckets")
    ? roleBuckets
    : [];
  const effectiveOrgIds = filterDimensions.includes("orgs") ? orgIds : [];

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const allowedSorts = new Set<string>(KIND_SORT_OPTIONS[kind]);
  let sort: ExploreSort;
  if (isPeople) {
    sort = trimmedQ ? "relevance" : KIND_DEFAULT_SORT_NO_Q[kind];
  } else if (SORT_SET.has(sortRaw) && allowedSorts.has(sortRaw)) {
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
      layers: effectiveLayers,
      categories: effectiveCategories,
      tags: effectiveTags,
      roleBuckets: effectiveRoleBuckets,
      orgIds: effectiveOrgIds,
      sort,
      limit: PAGE_SIZE,
      offset,
    }).catch((err) => {
      console.warn(`exploreEntities ${kind} failed:`, err);
      return { rows: [], total: 0 };
    }),
    isPeople
      ? getPeopleFacets({
          q: trimmedQ || undefined,
          roleBuckets: effectiveRoleBuckets,
          orgIds: effectiveOrgIds,
        }).catch((err) => {
          console.warn("getPeopleFacets failed:", err);
          return EMPTY_PEOPLE_FACETS;
        })
      : Promise.resolve(undefined),
  ]);

  const ssState = await getSaveFollowState(
    result.rows.map((r) => ({ kind, id: r.entity_id })),
  );

  if (isPeople) {
    return (
      <div className="mx-auto max-w-6xl">
        <PeopleExploreView
          kind={kind}
          initialRows={result.rows}
          initialTotal={result.total}
          initialQuery={q}
          initialFilter={{
            layers: [],
            categories: [],
            tags: [],
            roleBuckets: effectiveRoleBuckets,
            orgIds: effectiveOrgIds,
          }}
          initialSort={sort}
          initialOffset={offset}
          initialSavedKeys={Array.from(ssState.saved)}
          initialFollowingKeys={Array.from(ssState.following)}
          initialPeopleFacets={peopleFacets}
        />
      </div>
    );
  }

  const baseProps = {
    initialRows: result.rows,
    initialTotal: result.total,
    initialQuery: q,
    initialFilter: {
      layers: effectiveLayers,
      categories: effectiveCategories,
      tags: effectiveTags,
      roleBuckets: effectiveRoleBuckets,
      orgIds: effectiveOrgIds,
    },
    initialSort: sort,
    initialOffset: offset,
    initialSavedKeys: Array.from(ssState.saved),
    initialFollowingKeys: Array.from(ssState.following),
  };

  if (kind === "organization") {
    return (
      <div className="mx-auto max-w-6xl">
        <OrganizationExploreView kind={kind} {...baseProps} />
      </div>
    );
  }

  if (kind === "library") {
    return (
      <div className="mx-auto max-w-6xl">
        <LibraryExploreView kind={kind} {...baseProps} />
      </div>
    );
  }

  if (kind === "paper") {
    return (
      <div className="mx-auto max-w-6xl">
        <PaperExploreView kind={kind} {...baseProps} />
      </div>
    );
  }

  if (kind === "session") {
    return (
      <div className="mx-auto max-w-6xl">
        <SessionExploreView kind={kind} {...baseProps} />
      </div>
    );
  }

  if (kind === "youtube_video") {
    return (
      <div className="mx-auto max-w-6xl">
        <VideoExploreView kind={kind} {...baseProps} />
      </div>
    );
  }

  notFound();
}
