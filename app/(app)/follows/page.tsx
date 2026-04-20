import { SavedList } from "@/components/saves/saved-list";
import { SavedToolbar } from "@/components/saves/saved-toolbar";
import { requireUser } from "@/lib/auth/require-user";
import {
  countFollowsByKind,
  listFollowsForUser,
} from "@/lib/db/follows";
import { resolveEntitySummariesByRefs } from "@/lib/db/resolve-entity-summary";
import type { FollowEntityKind } from "@/lib/schema/entity-kind";

export const metadata = { title: "Follows" };

const PAGE_SIZE = 50;

type FollowsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseKinds(raw: unknown): FollowEntityKind[] {
  if (typeof raw !== "string" || !raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is FollowEntityKind => s.length > 0) as FollowEntityKind[];
}

export default async function FollowsPage({ searchParams }: FollowsPageProps) {
  const user = await requireUser();
  const sp = await searchParams;
  const kinds = parseKinds(sp.types);

  const [{ rows, total }, countsByKind] = await Promise.all([
    listFollowsForUser({
      userId: user.id,
      kinds: kinds.length > 0 ? kinds : undefined,
      limit: PAGE_SIZE,
    }),
    countFollowsByKind(user.id),
  ]);

  const refs = rows.map((r) => ({
    kind: r.entity_kind as FollowEntityKind,
    id: r.entity_id,
  }));
  const summaries = await resolveEntitySummariesByRefs(refs);

  const items = rows.map((r) => {
    const k = `${r.entity_kind}:${r.entity_id}`;
    const summary = summaries.get(k);
    return {
      kind: r.entity_kind as FollowEntityKind,
      id: r.entity_id,
      title: summary?.title ?? "Untitled",
      subtitle: summary?.subtitle ?? null,
      imageUrl: summary?.imageUrl ?? null,
      href: summary?.href ?? "#",
      ts: r.created_at,
    };
  });

  const totalAll = Object.values(countsByKind).reduce((acc, n) => acc + n, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Follows</h1>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} of {totalAll.toLocaleString()}
        </p>
      </header>

      <SavedToolbar
        total={totalAll}
        countsByKind={countsByKind}
        includeFollowKinds
      />

      <SavedList mode="follow" rows={items} />
    </div>
  );
}
