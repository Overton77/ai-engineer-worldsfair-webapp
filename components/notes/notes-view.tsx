"use client";

import { useMemo, useState } from "react";
import { Loader2, NotebookPen, Plus } from "lucide-react";

import { NoteEditor } from "@/components/notes/note-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { entityTypeLabel, type EntityType } from "@/lib/user-content";
import type { Tables } from "@/types/database.types";

type NotesViewProps = {
  initialNotes: Tables<"notes">[];
};

export function NotesView({ initialNotes }: NotesViewProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  const [noteBusy, setNoteBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(q) ||
        (note.content_text ?? "").toLowerCase().includes(q) ||
        (note.entity_title ?? "").toLowerCase().includes(q),
    );
  }, [notes, searchQuery]);

  async function saveNote(value: {
    title: string;
    contentJson: unknown;
    contentText: string;
  }) {
    setNoteBusy(true);

    const response = await fetch("/api/notes", {
      method: selectedNote ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedNote?.id,
        title: value.title,
        contentJson: value.contentJson,
        contentText: value.contentText,
        entityType: selectedNote?.entity_type ?? null,
        entityId: selectedNote?.entity_id ?? null,
        entityTitle: selectedNote?.entity_title ?? null,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: Tables<"notes">; error?: string }
      | null;

    setNoteBusy(false);

    if (!response.ok || !payload?.data) return;

    setNotes((current) => {
      const index = current.findIndex((note) => note.id === payload.data!.id);
      if (index === -1) return [payload.data!, ...current];
      const next = [...current];
      next[index] = payload.data!;
      return next.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
    });
    setSelectedNoteId(payload.data.id);
  }

  async function deleteSelectedNote() {
    if (!selectedNote) return;

    setNoteBusy(true);
    const response = await fetch(`/api/notes?id=${encodeURIComponent(selectedNote.id)}`, {
      method: "DELETE",
    });
    setNoteBusy(false);
    if (!response.ok) return;

    setNotes((current) => current.filter((note) => note.id !== selectedNote.id));
    setSelectedNoteId((current) => (current === selectedNote.id ? null : current));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <NotebookPen className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">My Notes</h1>
            <p className="text-sm text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setSelectedNoteId(null)}>
          <Plus className="mr-1.5 size-3.5" />
          New note
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-3">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="h-9 text-xs"
          />
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {filteredNotes.length ? (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selectedNoteId === note.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{note.title}</p>
                    {note.entity_type ? (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {entityTypeLabel(note.entity_type as EntityType)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {note.content_text || "No preview yet."}
                  </p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                    {new Date(note.updated_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </button>
              ))
            ) : (
              <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                {searchQuery ? "No notes match your search." : "No notes yet. Create one to get started."}
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{selectedNote ? "Edit note" : "New note"}</CardTitle>
            <CardDescription>
              {selectedNote?.entity_title
                ? `Attached to ${selectedNote.entity_title}`
                : "Create a private note for your research and ideas."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NoteEditor
              key={selectedNote?.id ?? "new-note"}
              title={selectedNote?.title ?? ""}
              contentJson={selectedNote?.content_json ?? null}
              entityLabel={selectedNote?.entity_title ?? null}
              busy={noteBusy}
              saveLabel={selectedNote ? "Update note" : "Create note"}
              onSave={saveNote}
              onDelete={selectedNote ? deleteSelectedNote : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
