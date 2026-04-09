"use client";

import { useMemo, useState } from "react";
import { Bookmark, Loader2, NotebookPen, UserRound } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { entityTypeLabel, type EntityType } from "@/lib/user-content";
import type { Tables } from "@/types/database.types";

type DashboardClientProps = {
  initialNotes: Tables<"notes">[];
  initialProfile: Tables<"profiles">;
  initialSavedItems: Tables<"saved_items">[];
  user: {
    email: string | null;
    id: string;
    lastSignInAt: string | null;
  };
};

export function DashboardClient({
  initialNotes,
  initialProfile,
  initialSavedItems,
  user,
}: DashboardClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [savedItems] = useState(initialSavedItems);
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  const [profileBusy, setProfileBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  async function saveProfile(formData: FormData) {
    setProfileBusy(true);
    setProfileMessage(null);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(formData.get("display_name") ?? "").trim() || null,
        bio: String(formData.get("bio") ?? "").trim() || null,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: Tables<"profiles">; error?: string }
      | null;

    if (!response.ok || !payload?.data) {
      setProfileMessage(payload?.error ?? "Failed to update profile.");
      setProfileBusy(false);
      return;
    }

    setProfile(payload.data);
    setProfileMessage("Profile updated.");
    setProfileBusy(false);
  }

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
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Your dashboard</CardTitle>
              <CardDescription>
                Signed in as <span className="font-medium text-foreground">{user.email ?? "—"}</span>.
                Save people, organizations, sessions, and videos from the directory, then keep personal or entity-linked notes here.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide">Profile id</p>
                <p className="mt-1 truncate font-medium text-foreground">{user.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Saved items</p>
                <p className="mt-1 font-medium text-foreground">{savedItems.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide">Last sign-in</p>
                <p className="mt-1 font-medium text-foreground">
                  {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspace summary</CardTitle>
              <CardDescription>Private to your account.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                <p className="font-medium text-foreground">Personal notes</p>
                <p className="text-muted-foreground">
                  {notes.filter((note) => !note.entity_type).length} standalone notes
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
                <p className="font-medium text-foreground">Entity-linked notes</p>
                <p className="text-muted-foreground">
                  {notes.filter((note) => !!note.entity_type).length} notes attached to saved exploration context
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="notes" className="gap-6">
          <TabsList>
            <TabsTrigger value="notes" className="gap-1.5">
              <NotebookPen className="size-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5">
              <Bookmark className="size-4" />
              Saved items
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5">
              <UserRound className="size-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Your notes</CardTitle>
                    <CardDescription>
                      Standalone notes and notes attached to entities you explored.
                    </CardDescription>
                  </div>
                  <Button type="button" size="sm" onClick={() => setSelectedNoteId(null)}>
                    New note
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {notes.length ? (
                  notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        selectedNoteId === note.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{note.title}</p>
                        {note.entity_type ? (
                          <Badge variant="outline">
                            {entityTypeLabel(note.entity_type as EntityType)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {note.content_text || "No preview yet."}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You do not have any notes yet. Create one here or from an entity inside the directory.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedNote ? "Edit note" : "New personal note"}</CardTitle>
                <CardDescription>
                  {selectedNote?.entity_title
                    ? `This note is attached to ${selectedNote.entity_title}.`
                    : "Create a private note for your own research and ideas."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NoteEditor
                  key={selectedNote?.id ?? "dashboard-new-note"}
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
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved exploration</CardTitle>
                <CardDescription>
                  Anything you save from the public directory shows up here for quick return visits.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {savedItems.length ? (
                  savedItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-2 font-medium text-foreground">{item.entity_title}</p>
                        <Badge variant="secondary">
                          {entityTypeLabel(item.entity_type as EntityType)}
                        </Badge>
                      </div>
                      {item.entity_subtitle ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {item.entity_subtitle}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You have not saved any entities yet. Browse the directory and use the save controls on people, organizations, sessions, and videos.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Your profile</CardTitle>
                <CardDescription>
                  This powers your private dashboard and saved research workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  key={profile.updated_at}
                  className="grid gap-4 md:max-w-2xl"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveProfile(new FormData(event.currentTarget));
                  }}
                >
                  <div className="grid gap-2">
                    <label htmlFor="display_name" className="text-sm font-medium text-foreground">
                      Display name
                    </label>
                    <Input
                      id="display_name"
                      name="display_name"
                      defaultValue={profile.display_name ?? ""}
                      placeholder="How should your profile appear?"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="bio" className="text-sm font-medium text-foreground">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      defaultValue={profile.bio ?? ""}
                      rows={5}
                      className="min-h-32 rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      placeholder="Add a short bio for your own dashboard context."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={profileBusy}>
                      {profileBusy ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Save profile
                    </Button>
                    {profileMessage ? (
                      <span className="text-sm text-muted-foreground">{profileMessage}</span>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
