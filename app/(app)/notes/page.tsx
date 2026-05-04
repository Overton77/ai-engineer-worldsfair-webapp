import { Notebook } from "lucide-react";

import { NotesPageShell } from "@/components/notes/notes-page-shell";
import { requireUser } from "@/lib/auth/require-user";
import {
  listNotesForUser,
  listRecentlyEditedNotes,
} from "@/lib/db/notes";
import { resolveEntitySummariesByRefs } from "@/lib/db/resolve-entity-summary";
import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";
import type { NoteSummary } from "@/lib/notes/types";
import { ENTITY_HREF } from "@/types/domain";

export const metadata = { title: "Notes" };

const PAGE_SIZE = 50;
const KIND_SET = new Set<string>(ENTITY_KINDS);

type NotesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const user = await requireUser();
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q : "";
  const pinKindRaw = typeof sp.pin === "string" ? sp.pin : "";
  const pinKind: EntityKind | undefined = KIND_SET.has(pinKindRaw)
    ? (pinKindRaw as EntityKind)
    : undefined;
  const freeformOnly = pinKindRaw === "freeform";

  const [{ rows, total }, recent] = await Promise.all([
    listNotesForUser({
      userId: user.id,
      q: q.trim() || undefined,
      pinKind,
      freeformOnly,
      limit: PAGE_SIZE,
    }),
    listRecentlyEditedNotes(user.id, 5),
  ]);

  // Resolve slugs for pinned entities so the "Open" button lands on the
  // canonical dossier URL (e.g. /p/<slug>, /lib/<slug>) instead of the
  // raw UUID, which would 404 on slug-keyed dossier routes.
  const refs = dedupeRefs(
    [...rows, ...recent]
      .filter((n): n is NoteSummary & { pinKind: EntityKind; pinId: string } =>
        Boolean(n.pinKind && n.pinId),
      )
      .map((n) => ({ kind: n.pinKind, id: n.pinId })),
  );
  const summaries = await resolveEntitySummariesByRefs(refs);

  const enrichedRows = rows.map((n) => withOpenHref(n, summaries));
  const enrichedRecent = recent.map((n) => withOpenHref(n, summaries));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-baseline justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Notebook className="size-5" />
          Notes
        </h1>
        <p className="text-muted-foreground text-sm">
          {total.toLocaleString()} {q ? "matches" : "notes"}
        </p>
      </header>

      <NotesPageShell
        rows={enrichedRows}
        recent={enrichedRecent}
        initialQuery={q}
        initialPin={pinKindRaw}
      />
    </div>
  );
}

function dedupeRefs(
  refs: ReadonlyArray<{ kind: EntityKind; id: string }>,
): Array<{ kind: EntityKind; id: string }> {
  const seen = new Set<string>();
  const out: Array<{ kind: EntityKind; id: string }> = [];
  for (const r of refs) {
    const k = `${r.kind}:${r.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

function withOpenHref(
  note: NoteSummary,
  summaries: Awaited<ReturnType<typeof resolveEntitySummariesByRefs>>,
): NoteSummary & { openHref: string } {
  if (note.pinKind && note.pinId) {
    const resolved = summaries.get(`${note.pinKind}:${note.pinId}`);
    const dossierHref = resolved?.href ?? ENTITY_HREF[note.pinKind](note.pinId);
    return {
      ...note,
      openHref: `${dossierHref}?notes=split&note=${encodeURIComponent(note.id)}`,
    };
  }
  return { ...note, openHref: `/notes/${note.id}` };
}
