import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NoteFocusEditor } from "@/components/notes/note-focus-editor";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { getNoteById } from "@/lib/db/notes";
import { resolveEntitySummariesByRefs } from "@/lib/db/resolve-entity-summary";
import type {
  EntityKind,
  FollowEntityKind,
} from "@/lib/schema/entity-kind";
import type { NoteDoc, NotePin } from "@/lib/notes/types";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Note ${id.slice(0, 8)}` };
}

export default async function NoteFocusPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const row = await getNoteById(id, user.id);
  if (!row) notFound();

  let pinSummary: { href: string; title: string } | null = null;
  if (row.entity_type && row.entity_id) {
    const summaries = await resolveEntitySummariesByRefs([
      {
        kind: row.entity_type as FollowEntityKind,
        id: row.entity_id,
      },
    ]);
    const s = summaries.get(`${row.entity_type}:${row.entity_id}`);
    if (s)
      pinSummary = {
        href: `${s.href}?notes=split&note=${encodeURIComponent(row.id)}`,
        title: s.title,
      };
  }

  const pin: NotePin | null =
    row.entity_type && row.entity_id
      ? {
          kind: row.entity_type as EntityKind,
          id: row.entity_id,
          title: row.entity_title ?? "Untitled",
        }
      : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <Button asChild size="xs" variant="ghost">
          <Link href="/notes">
            <ArrowLeft className="size-3" />
            All notes
          </Link>
        </Button>
        {pinSummary ? (
          <Button asChild size="xs" variant="outline">
            <Link href={pinSummary.href}>Open with {pinSummary.title} ↗</Link>
          </Button>
        ) : null}
      </header>

      <div className="border-border/60 bg-card min-h-[70vh] rounded-xl border">
        <NoteFocusEditor
          noteId={row.id}
          initialTitle={row.title}
          initialContent={(row.content_json as unknown as NoteDoc) ?? null}
          pin={pin}
        />
      </div>
    </div>
  );
}
