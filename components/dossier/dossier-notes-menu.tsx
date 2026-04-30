"use client";

import { Columns, ExternalLink, Notebook, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { createNoteAction } from "@/app/actions/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNoteUrlState } from "@/lib/notes/use-note-url-state";
import type { NoteSummary } from "@/lib/notes/types";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

type DossierNotesMenuProps = {
  entity: { kind: EntityKind; id: string; title: string };
  notesCount: number;
  notes?: readonly NoteSummary[];
};

export function DossierNotesMenu({
  entity,
  notesCount,
  notes = [],
}: DossierNotesMenuProps) {
  const router = useRouter();
  const {
    notes: layout,
    openDrawerNote,
    openDrawerNewNote,
    openPanel,
    openPanelNote,
    closePanelAndNote,
  } = useNoteUrlState();
  const [creating, setCreating] = React.useState(false);
  const isPanelOpen = layout === "split" || layout === "focus";
  const recentNotes = notes.slice(0, 3);
  const hasMoreNotes = notesCount > recentNotes.length;

  const createPanelNote = async () => {
    setCreating(true);
    try {
      const result = await createNoteAction({
        pin: { kind: entity.kind, id: entity.id, title: entity.title },
      });
      if (result.ok) {
        openPanelNote(result.id);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  };

  const onNewNote = () => {
    if (isPanelOpen) {
      void createPanelNote();
      return;
    }
    openDrawerNewNote({ kind: entity.kind, id: entity.id });
  };

  const onOpenNote = (id: string) => {
    if (isPanelOpen) {
      openPanelNote(id);
      return;
    }
    openDrawerNote(id);
  };

  const onTogglePanel = () => {
    if (isPanelOpen) {
      closePanelAndNote();
      return;
    }
    openPanel();
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant={isPanelOpen ? "secondary" : "outline"}
                    aria-label={`Notes for ${entity.title}`}
                    aria-pressed={isPanelOpen}
                  >
                    <Notebook className="size-3.5" />
                    Notes
                    {notesCount > 0 ? (
                      <Badge variant="outline" className="text-[10px]">
                        {notesCount}
                      </Badge>
                    ) : null}
                  </Button>
                }
              />
            }
          />
          <TooltipContent>
            Create, view, and manage notes pinned to this entity.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuItem onClick={onNewNote} disabled={creating}>
          <Plus className="size-4" />
          <div className="flex min-w-0 flex-col">
            <span>New note</span>
            <span className="text-muted-foreground text-xs">
              Quick capture pinned to this entity
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTogglePanel}>
          <Columns className="size-4" />
          <div className="flex min-w-0 flex-col">
            <span>{isPanelOpen ? "Close notes panel" : "Open notes panel"}</span>
            {!isPanelOpen ? (
              <span className="text-muted-foreground text-xs">
                Read and edit notes beside this dossier
              </span>
            ) : null}
          </div>
        </DropdownMenuItem>

        {recentNotes.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Recent pinned notes</DropdownMenuLabel>
              {recentNotes.map((note) => (
                <DropdownMenuItem
                  key={note.id}
                  onClick={() => onOpenNote(note.id)}
                  className="items-start"
                >
                  <NoteRow note={note} />
                </DropdownMenuItem>
              ))}
              {hasMoreNotes ? (
                <DropdownMenuItem onClick={() => openPanel()}>
                  <Columns className="size-4" />
                  View all in notes panel
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/notes">
              <ExternalLink className="size-4" />
              Open notes workspace
            </Link>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NoteRow({ note }: { note: NoteSummary }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5")}>
      <span className="truncate text-sm font-medium">{note.title}</span>
      {note.preview ? (
        <span className="text-muted-foreground line-clamp-1 text-xs">
          {note.preview}
        </span>
      ) : null}
    </div>
  );
}
