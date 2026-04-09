"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Loader2, NotebookPen } from "lucide-react";

import { NoteEditor } from "@/components/notes/note-editor";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { entityTypeLabel, type EntityReference } from "@/lib/user-content";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Viewer = {
  email?: string | null;
  id: string;
} | null;

type EntityUserPanelProps = {
  entity: EntityReference;
  viewer: Viewer;
  className?: string;
};

function SignInPrompt() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Save to your profile</CardTitle>
        <CardDescription>
          Sign in to save this entity and keep private notes attached to it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/?redirect=/dashboard"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Sign in to save notes
        </Link>
      </CardContent>
    </Card>
  );
}

export function EntityUserPanel({
  entity,
  viewer,
  className,
}: EntityUserPanelProps) {
  const [savedItems, setSavedItems] = useState<Tables<"saved_items">[]>([]);
  const [notes, setNotes] = useState<Tables<"notes">[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (!viewer) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSavedItems([]);
      setNotes([]);
      setSelectedNoteId(null);

      try {
        const [savedResponse, notesResponse] = await Promise.all([
          fetch("/api/saved-items"),
          fetch(
            `/api/notes?entityType=${encodeURIComponent(entity.entityType)}&entityId=${encodeURIComponent(entity.entityId)}`,
          ),
        ]);

        if (cancelled) return;

        const savedPayload = (await savedResponse.json().catch(() => null)) as
          | { data?: Tables<"saved_items">[] }
          | null;
        const notesPayload = (await notesResponse.json().catch(() => null)) as
          | { data?: Tables<"notes">[] }
          | null;

        setSavedItems(savedPayload?.data ?? []);
        setNotes(notesPayload?.data ?? []);
        setSelectedNoteId(notesPayload?.data?.[0]?.id ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [entity.entityId, entity.entityType, viewer]);

  const saved = useMemo(
    () =>
      savedItems.some(
        (item) =>
          item.entity_type === entity.entityType && item.entity_id === entity.entityId,
      ),
    [entity.entityId, entity.entityType, savedItems],
  );

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  async function toggleSaved() {
    if (!viewer) return;

    setSaveBusy(true);
    const response = await fetch(
      saved
        ? `/api/saved-items?entityType=${encodeURIComponent(entity.entityType)}&entityId=${encodeURIComponent(entity.entityId)}`
        : "/api/saved-items",
      saved
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityType: entity.entityType,
              entityId: entity.entityId,
              entityTitle: entity.entityTitle,
              entitySubtitle: entity.entitySubtitle ?? null,
            }),
          },
    );
    setSaveBusy(false);

    if (!response.ok) return;

    if (saved) {
      setSavedItems((current) =>
        current.filter(
          (item) =>
            !(
              item.entity_type === entity.entityType && item.entity_id === entity.entityId
            ),
        ),
      );
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: Tables<"saved_items"> }
      | null;
    if (payload?.data) {
      setSavedItems((current) => [payload.data!, ...current]);
    }
  }

  async function saveNote(value: {
    title: string;
    contentJson: unknown;
    contentText: string;
  }) {
    if (!viewer) return;

    setNoteBusy(true);
    const response = await fetch("/api/notes", {
      method: selectedNote ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedNote?.id,
        title: value.title,
        contentJson: value.contentJson,
        contentText: value.contentText,
        entityType: entity.entityType,
        entityId: entity.entityId,
        entityTitle: entity.entityTitle,
      }),
    });
    setNoteBusy(false);
    if (!response.ok) return;

    const payload = (await response.json().catch(() => null)) as
      | { data?: Tables<"notes"> }
      | null;
    if (!payload?.data) return;

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
    setSelectedNoteId(null);
  }

  if (!viewer) {
    return <SignInPrompt />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Profile actions</CardTitle>
              <CardDescription>
                Save this {entityTypeLabel(entity.entityType).toLowerCase()} or attach a private note to it.
              </CardDescription>
            </div>
            <Button type="button" variant={saved ? "default" : "outline"} size="sm" onClick={() => void toggleSaved()} disabled={saveBusy}>
              {saveBusy ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Bookmark className="mr-2 size-3.5" />
              )}
              {saved ? "Saved" : "Save to profile"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Notes for this entity</CardTitle>
              <CardDescription>
                Keep private context tied to this {entityTypeLabel(entity.entityType).toLowerCase()}.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedNoteId(null)}>
              <NotebookPen className="mr-2 size-3.5" />
              New note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading saved state and notes…
            </div>
          ) : null}

          {notes.length ? (
            <div className="flex flex-wrap gap-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    selectedNoteId === note.id
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/40"
                  }`}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  {note.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No notes for this entity yet. Create one below.
            </p>
          )}

          <NoteEditor
            key={selectedNote?.id ?? `${entity.entityType}-${entity.entityId}-new`}
            title={selectedNote?.title ?? ""}
            contentJson={selectedNote?.content_json ?? null}
            entityLabel={entity.entityTitle}
            busy={noteBusy}
            saveLabel={selectedNote ? "Update note" : "Create note"}
            onSave={saveNote}
            onDelete={selectedNote ? deleteSelectedNote : undefined}
            deleteDisabled={noteBusy}
          />

          {saved ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Saved to profile</Badge>
              <span>Shows up on your private dashboard workspace.</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
