import { notFound } from "next/navigation";

import {
  CATEGORY_KEYS,
  DOMAIN_LAYERS,
  type CategoryKey,
  type DomainLayer,
} from "@/lib/schema/taxonomy";
import {
  EXPLORE_KIND_LABELS,
  EXPLORE_KINDS,
  EXPLORE_SORTS,
  exploreEntities,
  type ExploreKind,
  type ExploreSort,
} from "@/lib/search/explore";

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
  const trimmedQ = q.trim();
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: ExploreSort = SORT_SET.has(sortRaw)
    ? (sortRaw as ExploreSort)
    : trimmedQ
      ? "relevance"
      : "popularity";

  const result = await exploreEntities(kind, {
    q: trimmedQ || undefined,
    layers,
    categories,
    tags,
    sort,
    limit: PAGE_SIZE,
    offset: 0,
  }).catch((err) => {
    console.warn(`exploreEntities ${kind} failed:`, err);
    return { rows: [], total: 0 };
  });

  return (
    <div className="mx-auto max-w-6xl">
      <ExploreShell
        kind={kind}
        initialRows={result.rows}
        initialTotal={result.total}
        initialQuery={q}
        initialFilter={{ layers, categories, tags }}
        initialSort={sort}
      />
    </div>
  );
}
