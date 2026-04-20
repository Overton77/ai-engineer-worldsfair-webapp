"use client";

import { Loader2, Plus } from "lucide-react";
import * as React from "react";

import { createNoteAction } from "@/app/actions/notes";
import {
  bootstrapDrawerAction,
  type DrawerBootstrap,
} from "@/app/actions/drawer-bootstrap";
import { listNotesForEntityAction } from "@/app/actions/notes";
import { Button } from "@/components/ui/button";
import type { EntityKind } from "@/lib/schema/entity-kind";
import {
  type NoteDoc,
  type NotePin,
  type NoteSummary,
} from "@/lib/notes/types";
import { cn } from "@/lib/utils";

import { NoteEditor, type NoteEditorHandle, type NoteEditorVideoCtx } from "./note-editor";

type EntityNotesPanelProps = {
  entityRef: { kind: EntityKind; id: string; title: string };
  /** Active note id from the URL (?note=...). Drives selection. */
  activeNoteId: string | null;
  onActiveNoteChange: (id: string | null) => void;
  /** Optional video context — passed straight through to the editor. */
  videoCtx?: NoteEditorVideoCtx;
  /** When true, hide the picker list to focus on the editor. */
  hideList?: boolean;
  className?: string;
};

/**
 * The right pane of the N2 split / N3 watch+notes shell. Owns:
 *  - the list of notes pinned to the entity (top, scrollable)
 *  - the active editor (bottom)
 *
 * When `activeNoteId` is null we show the empty state with a "+ New
 * note" button that creates a row server-side and propagates the new
 * id back to the parent (so the URL can update via ?note=).
 */
export function EntityNotesPanel({
  entityRef,
  activeNoteId,
  onActiveNoteChange,
  videoCtx,
  hideList = false,
  className,
}: EntityNotesPanelProps) {
  const [notes, setNotes] = React.useState<NoteSummary[]>([]);
  const [loadingList, setLoadingList] = React.useState(true);
  const [editorBoot, setEditorBoot] = React.useState<DrawerBootstrap | null>(
    null,
  );
  const [loadingEditor, setLoadingEditor] = React.useState(false);
  const editorRef = React.useRef<NoteEditorHandle | null>(null);

  // Load list of notes for this entity (and refetch when the active note changes
  // — the just-edited note might've changed its preview / title).
  const refreshList = React.useCallback(async () => {
    setLoadingList(true);
    const res = await listNotesForEntityAction({
      kind: entityRef.kind,
      id: entityRef.id,
    });
    setNotes(res.rows);
    setLoadingList(false);
  }, [entityRef.kind, entityRef.id]);

  React.useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Bootstrap the editor when activeNoteId changes
  React.useEffect(() => {
    if (!activeNoteId) {
      setEditorBoot(null);
      return;
    }
    let cancelled = false;
    setLoadingEditor(true);
    bootstrapDrawerAction({ mode: "existing", noteId: activeNoteId })
      .then((res) => {
        if (cancelled) return;
        setEditorBoot(res);
        setLoadingEditor(false);
      })
      .catch(() => {
        if (cancelled) return;
        setEditorBoot({ ok: false, error: "Failed to load note" });
        setLoadingEditor(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeNoteId]);

  const onCreate = async () => {
    const result = await createNoteAction({
      pin: { kind: entityRef.kind, id: entityRef.id, title: entityRef.title },
    });
    if (result.ok) {
      onActiveNoteChange(result.id);
      refreshList();
    }
  };

  return (
    <aside className={cn("flex h-full min-h-0 flex-col", className)}>
      {!hideList ? (
        <div className="border-border/60 flex max-h-[200px] flex-col gap-1 overflow-y-auto border-b px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
              Notes for {entityRef.title} ({notes.length})
            </p>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={onCreate}
            >
              <Plus className="size-3" />
              New
            </Button>
          </div>
          {loadingList ? (
            <div className="flex justify-center py-3">
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-muted-foreground py-2 text-xs">
              No notes yet. Hit New to start one.
            </p>
          ) : (
            notes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onActiveNoteChange(n.id)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-left transition-colors",
                  n.id === activeNoteId
                    ? "bg-muted"
                    : "hover:bg-muted/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium">{n.title}</p>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    {short(n.updatedAt)}
                  </span>
                </div>
                {n.preview ? (
                  <p className="text-muted-foreground line-clamp-1 text-[11px]">
                    {n.preview}
                  </p>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {!activeNoteId ? (
          <EmptyEditor
            entityTitle={entityRef.title}
            onCreate={onCreate}
            disabled={loadingList}
          />
        ) : loadingEditor || !editorBoot ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : !editorBoot.ok ? (
          <p className="text-destructive p-4 text-sm">{editorBoot.error}</p>
        ) : (
          <NoteEditor
            ref={editorRef}
            noteId={editorBoot.noteId}
            initialTitle={editorBoot.title}
            initialContent={editorBoot.contentJson as NoteDoc}
            pin={
              editorBoot.pin
                ? ({
                    kind: editorBoot.pin.kind as never,
                    id: editorBoot.pin.id,
                    title: editorBoot.pin.title,
                  } as NotePin)
                : null
            }
            videoCtx={videoCtx}
            onSaved={refreshList}
            onDeleted={() => {
              onActiveNoteChange(null);
              refreshList();
            }}
          />
        )}
      </div>
    </aside>
  );
}

function EmptyEditor({
  entityTitle,
  onCreate,
  disabled,
}: {
  entityTitle: string;
  onCreate: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium">No note open</p>
      <p className="text-muted-foreground max-w-prose text-xs">
        Notes you take here are pinned to <strong>{entityTitle}</strong>.
        They&rsquo;ll show up in the list above and on the Notes page.
      </p>
      <Button type="button" size="sm" onClick={onCreate} disabled={disabled}>
        <Plus className="size-3" />
        New note
      </Button>
    </div>
  );
}

function short(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}
