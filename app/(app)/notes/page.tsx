import { Notebook } from "lucide-react";

import { NotesPageShell } from "@/components/notes/notes-page-shell";
import { requireUser } from "@/lib/auth/require-user";
import {
  listNotesForUser,
  listRecentlyEditedNotes,
} from "@/lib/db/notes";
import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";

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
        rows={rows}
        recent={recent}
        initialQuery={q}
        initialPin={pinKindRaw}
      />
    </div>
  );
}
