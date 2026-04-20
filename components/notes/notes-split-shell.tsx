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

  if (!isOpen) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("flex min-h-[60vh]", className)}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="hidden min-h-[70vh] xl:flex"
      >
        <ResizablePanel defaultSize={62} minSize={40} maxSize={75}>
          <div className="h-full overflow-y-auto pr-4">{children}</div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={38} minSize={25}>
          <EntityNotesPanel
            entityRef={entityRef}
            activeNoteId={note}
            onActiveNoteChange={(id) => openNote(id ?? "")}
            className="border-border/60 bg-card/40 rounded-xl border"
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* On smaller screens stack vertically with no resize handle */}
      <div className="flex w-full flex-col gap-4 xl:hidden">
        <div className="min-h-0">{children}</div>
        <div className="border-border/60 bg-card/40 h-[60vh] rounded-xl border">
          <EntityNotesPanel
            entityRef={entityRef}
            activeNoteId={note}
            onActiveNoteChange={(id) => openNote(id ?? "")}
          />
        </div>
      </div>
    </div>
  );
}
