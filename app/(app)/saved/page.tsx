import { SavedList } from "@/components/saves/saved-list";
import { SavedToolbar } from "@/components/saves/saved-toolbar";
import { requireUser } from "@/lib/auth/require-user";
import {
  countSavesByType,
  listSavesForUser,
} from "@/lib/db/saves";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { ENTITY_HREF } from "@/types/domain";

export const metadata = { title: "Saved" };

const PAGE_SIZE = 50;
const SORT_VALUES = ["recent", "alpha"] as const;
type SortValue = (typeof SORT_VALUES)[number];
const SORT_SET = new Set<string>(SORT_VALUES);

type SavedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseTypes(raw: unknown): EntityKind[] {
  if (typeof raw !== "string" || !raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is EntityKind => s.length > 0) as EntityKind[];
}

export default async function SavedPage({ searchParams }: SavedPageProps) {
  const user = await requireUser();
  const sp = await searchParams;

  const types = parseTypes(sp.types);
  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: SortValue = SORT_SET.has(sortRaw)
    ? (sortRaw as SortValue)
    : "recent";

  const [{ rows, total }, countsByKind] = await Promise.all([
    listSavesForUser({
      userId: user.id,
      types: types.length > 0 ? types : undefined,
      sort,
      limit: PAGE_SIZE,
    }),
    countSavesByType(user.id),
  ]);

  const items = rows.map((r) => ({
    kind: r.entity_type as EntityKind,
    id: r.entity_id,
    title: r.entity_title,
    subtitle: r.entity_subtitle,
    imageUrl: null,
    href: ENTITY_HREF[r.entity_type as EntityKind](r.entity_id),
    ts: r.created_at,
  }));

  const totalAll = Object.values(countsByKind).reduce((acc, n) => acc + n, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} of {totalAll.toLocaleString()}
        </p>
      </header>

      <SavedToolbar total={totalAll} countsByKind={countsByKind} />

      <SavedList mode="saved" rows={items} />
    </div>
  );
}
