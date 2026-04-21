"use client";

import { ExternalLink, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  bootstrapDrawerAction,
  type DrawerBootstrap,
} from "@/app/actions/drawer-bootstrap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNoteUrlState } from "@/lib/notes/use-note-url-state";
import {
  type NoteDoc,
  type NotePin,
  type NoteSummary,
} from "@/lib/notes/types";
import { cn } from "@/lib/utils";

import { NoteEditor, type NoteEditorHandle } from "./note-editor";

/**
 * N1 NotesQuickDrawer — mounted at the app shell. Reads ?note= from
 * the URL and opens a right-side Sheet with:
 *  - the entity strip (sticky top)
 *  - the list of notes pinned to that entity
 *  - the active editor (single shared <NoteEditor>)
 *
 * Promote-to-split = router push to the entity dossier with
 * ?notes=split&note=<id>.
 */
export function NotesQuickDrawer() {
  const router = useRouter();
  const { note, notes, pinTo, closeNote } = useNoteUrlState();
  const [boot, setBoot] = React.useState<DrawerBootstrap | null>(null);
  const [loading, setLoading] = React.useState(false);
  const editorRef = React.useRef<NoteEditorHandle | null>(null);

  // The drawer is the secondary surface — it must stay closed when
  // the host page is already showing the note inline (split / theatre
  // / focus on a dossier). Without this guard, every inline
  // `openNote()` call also pops the drawer because both surfaces
  // listen to the same `?note=` param.
  const inlineSurfaceActive = notes !== null;

  // `?note=new` without a `pinTo` is a dead-end — the bootstrap
  // action can't create a row without an entity, so the drawer would
  // sit on a perpetual spinner. Treat it as closed.
  const isOrphanNew = note === "new" && !pinTo;

  const open = note !== null && !inlineSurfaceActive && !isOrphanNew;

  // Bootstrap whenever the (note, pinTo) pair changes
  React.useEffect(() => {
    if (!open) {
      setBoot(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setBoot(null);
    const args =
      note === "new" && pinTo
        ? { mode: "new" as const, pinTo: { kind: pinTo.kind, id: pinTo.id } }
        : note && note !== "new"
          ? { mode: "existing" as const, noteId: note }
          : null;
    if (!args) {
      // ?note=new without pinTo isn't supported in v1 — must come from
      // a button that knows the entity.
      setLoading(false);
      return;
    }
    bootstrapDrawerAction(args)
      .then((res) => {
        if (cancelled) return;
        setBoot(res);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setBoot({ ok: false, error: "Failed to load note" });
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, note, pinTo?.kind, pinTo?.id]);

  // When the sheet closes, flush autosave first.
  const onOpenChange = async (next: boolean) => {
    if (!next) {
      await editorRef.current?.flush();
      closeNote();
    }
  };

  const promoteToSplit = () => {
    if (boot?.ok && boot.entity) {
      router.push(
        `${boot.entity.href}?notes=split&note=${encodeURIComponent(boot.noteId)}`,
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] p-0"
        aria-describedby="notes-drawer-help"
      >
        <SheetHeader className="flex-row items-start justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <DrawerEntityStrip boot={boot} loading={loading} />
          </div>
        </SheetHeader>

        <div
          id="notes-drawer-help"
          className="text-muted-foreground sr-only"
        >
          Notes for the selected entity. Press Esc to close.
        </div>

        {loading || !boot ? (
          <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : !boot.ok ? (
          <div className="text-destructive p-6 text-sm">
            {boot.error}
          </div>
        ) : (
          <>
            <NotesListStrip
              notes={boot.notes}
              activeId={boot.noteId}
              pin={boot.pin}
            />
            <div className="min-h-0 flex-1">
              <NoteEditor
                ref={editorRef}
                noteId={boot.noteId}
                initialTitle={boot.title}
                initialContent={boot.contentJson as NoteDoc}
                pin={
                  boot.pin
                    ? ({
                        kind: boot.pin.kind as never,
                        id: boot.pin.id,
                        title: boot.pin.title,
                      } as NotePin)
                    : null
                }
                compact
              />
            </div>
            <footer className="border-border/60 flex items-center justify-between border-t px-4 py-2 text-xs">
              <span className="text-muted-foreground">N1 drawer</span>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={promoteToSplit}
                disabled={!boot.entity}
              >
                <ExternalLink className="size-3" />
                Open in split
              </Button>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerEntityStrip({
  boot,
  loading,
}: {
  boot: DrawerBootstrap | null;
  loading: boolean;
}) {
  if (loading || !boot) {
    return (
      <SheetTitle className="text-sm text-muted-foreground">
        Loading…
      </SheetTitle>
    );
  }
  if (!boot.ok) {
    return <SheetTitle className="text-sm">Note</SheetTitle>;
  }
  if (!boot.entity) {
    return (
      <SheetTitle className="truncate text-sm font-semibold">
        {boot.title || "Untitled"}
      </SheetTitle>
    );
  }
  const e = boot.entity;
  return (
    <Link
      href={e.href}
      className="group flex min-w-0 flex-1 items-center gap-2 hover:opacity-90"
    >
      <Avatar className="size-9 shrink-0">
        {e.imageUrl ? <AvatarImage src={e.imageUrl} alt="" /> : null}
        <AvatarFallback className="text-[10px]">
          {e.title.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <SheetTitle className="truncate text-sm">
          {e.title}
        </SheetTitle>
        {e.subtitle ? (
          <p className="text-muted-foreground truncate text-[10px]">
            {e.subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function NotesListStrip({
  notes,
  activeId,
  pin,
}: {
  notes: NoteSummary[];
  activeId: string;
  pin: { kind: string; id: string; title: string } | null;
}) {
  const router = useRouter();
  const others = notes.filter((n) => n.id !== activeId);
  if (!pin || others.length === 0) return null;
  return (
    <div className="border-border/60 flex max-h-[140px] flex-col gap-1 overflow-y-auto border-b px-3 py-2">
      <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
        Other notes for this entity ({others.length})
      </p>
      {others.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => {
            router.push(`?note=${encodeURIComponent(n.id)}`, {
              scroll: false,
            });
          }}
          className={cn(
            "hover:bg-muted rounded-md px-2 py-1.5 text-left transition-colors",
          )}
        >
          <p className="truncate text-xs font-medium">{n.title}</p>
          {n.preview ? (
            <p className="text-muted-foreground line-clamp-1 text-[11px]">
              {n.preview}
            </p>
          ) : null}
        </button>
      ))}
      <Link
        href="/notes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 text-[10px]"
      >
        <Plus className="size-3" />
        Open Notes workspace
      </Link>
    </div>
  );
}
