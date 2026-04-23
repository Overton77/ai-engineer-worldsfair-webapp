"use client";

import * as React from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useNoteUrlState } from "@/lib/notes/use-note-url-state";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

import { EntityNotesPanel } from "./entity-notes-panel";

type NotesSplitShellProps = {
  entityRef: { kind: EntityKind; id: string; title: string };
  /** The dossier body. Renders full-width when notes are off. */
  children: React.ReactNode;
  className?: string;
};

/**
 * N2 split shell — wraps a dossier with a resizable notes pane.
 *
 * Toggle is driven entirely from the URL (`?notes=split`) so the
 * dossier hero's "Notes" button can be a simple Link. We listen to
 * the param via `useNoteUrlState` and conditionally render the right
 * pane.
 *
 * The split orientation is horizontal on >=1280px, vertical (notes
 * below) on smaller screens — wireframe constraint from 03a §10 Q2.
 */
export function NotesSplitShell({
  entityRef,
  children,
  className,
}: NotesSplitShellProps) {
  const { notes, note, openNote } = useNoteUrlState();
  const isOpen = notes === "split" || notes === "focus";
  const isWide = useIsWide();

  if (!isOpen) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "flex h-[calc(100svh-14rem)] min-h-[520px] flex-col",
        className,
      )}
    >
      <ResizablePanelGroup
        orientation={isWide ? "horizontal" : "vertical"}
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          defaultSize={isWide ? "62%" : "58%"}
          minSize="35%"
          maxSize="80%"
        >
          <div
            className={cn(
              "h-full overflow-y-auto",
              isWide ? "pr-4" : "pb-4",
            )}
          >
            {children}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={isWide ? "38%" : "42%"} minSize="20%">
          <EntityNotesPanel
            entityRef={entityRef}
            activeNoteId={note}
            onActiveNoteChange={(id) => openNote(id ?? "")}
            className={cn(
              "border-border/60 bg-card/40 h-full rounded-xl border",
              isWide ? "ml-4" : "mt-4",
            )}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function useIsWide(): boolean {
  const [wide, setWide] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(min-width: 1280px)");
    const sync = () => setWide(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  return wide;
}
