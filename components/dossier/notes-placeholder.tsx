"use client";

import { Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { createNoteAction } from "@/app/actions/notes";
import { Button } from "@/components/ui/button";
import { useNoteUrlState } from "@/lib/notes/use-note-url-state";
import type { EntityKind } from "@/lib/schema/entity-kind";
import type { NoteSummary } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

type Props = {
  entity: { kind: EntityKind; id: string; title: string };
  notes: NoteSummary[];
};

/**
 * In-page Notes section rendered at the bottom of every dossier when
 * the split pane is OFF. Lists existing pinned notes and offers to
 * create a new one (which opens the N1 drawer for instant capture).
 *
 * When the user toggles the split pane on, the dossier wraps in
 * `<NotesSplitShell>` and this footer block becomes redundant — the
 * caller is free to keep rendering it (it doesn't conflict) or hide
 * it; we render it unconditionally so users always have a baseline
 * way to spot pinned notes.
 */
export function EntityNotesFooter({ entity, notes }: Props) {
  const router = useRouter();
  const { openNote, openNewNote } = useNoteUrlState();

  const onCreate = async () => {
    const result = await createNoteAction({
      pin: { kind: entity.kind, id: entity.id, title: entity.title },
    });
    if (result.ok) {
      openNote(result.id);
    } else {
      // fall back to opening drawer with new+pinTo
      openNewNote({ kind: entity.kind, id: entity.id });
    }
    // Re-fetch SSR data so the count badge in the hero stays current.
    router.refresh();
  };

  if (notes.length === 0) {
    return (
      <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-8 text-center">
        <Pencil className="text-muted-foreground size-7" />
        <p className="text-sm font-medium">No notes yet</p>
        <p className="text-muted-foreground max-w-prose text-xs">
          Pin a note to <strong>{entity.title}</strong> to keep your thoughts
          alongside the dossier. Click the [║ Notes] toggle above to open the
          side pane, or start a quick one here.
        </p>
        <Button type="button" size="sm" onClick={onCreate}>
          <Plus className="size-3" />
          New note
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {notes.map((n) => (
          <li
            key={n.id}
            className={cn(
              "border-border/60 bg-card hover:border-border flex items-center gap-3 rounded-xl border p-3 transition-colors",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{n.title}</p>
              {n.preview ? (
                <p className="text-muted-foreground line-clamp-1 text-xs">
                  {n.preview}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => openNote(n.id)}
            >
              Open
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={onCreate}
        className="self-start"
      >
        <Plus className="size-3" />
        New note for {entity.title}
      </Button>
    </div>
  );
}

/** Backwards-compatible export name; old callers used `NotesPlaceholder`. */
export function NotesPlaceholder() {
  return null;
}
