"use client";

import { ExternalLink, Pencil, Pin, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import * as React from "react";
import { toast } from "sonner";

import { createNoteAction } from "@/app/actions/notes";
import { EntityKindIcon } from "@/components/explore/entity-kind-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ENTITY_KINDS,
  type EntityKind,
} from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";
import { ENTITY_HREF } from "@/types/domain";
import type { NoteSummary } from "@/lib/notes/types";

const PIN_FILTERS: Array<{ id: string; label: string }> = [
  { id: "", label: "All notes" },
  { id: "freeform", label: "Freeform" },
  ...ENTITY_KINDS.filter((k) => k !== "notes" && k !== "image" && k !== "attempt").map(
    (k) => ({ id: k, label: kindLabel(k) }),
  ),
];

function kindLabel(k: EntityKind): string {
  return k
    .split("_")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}

type NotesPageShellProps = {
  rows: NoteSummary[];
  recent: NoteSummary[];
  initialQuery: string;
  initialPin: string;
};

export function NotesPageShell({
  rows,
  recent,
  initialQuery,
  initialPin,
}: NotesPageShellProps) {
  const router = useRouter();
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(initialQuery),
      pin: parseAsString.withDefault(initialPin),
    },
    { history: "replace" },
  );

  const onCreateFreeform = async () => {
    const result = await createNoteAction({});
    if (result.ok) {
      router.push(`/notes/${result.id}`);
    } else {
      toast.error(result.error || "Failed to create note");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="border-border/60 bg-background flex items-center gap-2 rounded-lg border px-3">
          <Search className="text-muted-foreground size-4" />
          <Input
            value={params.q}
            onChange={(e) => setParams({ q: e.target.value })}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </label>
        <Button
          type="button"
          onClick={onCreateFreeform}
          className="justify-center"
        >
          <Plus className="size-3.5" />
          New freeform
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {PIN_FILTERS.map((f) => (
          <Button
            key={f.id || "all"}
            type="button"
            size="xs"
            variant={params.pin === f.id ? "default" : "outline"}
            onClick={() => setParams({ pin: f.id })}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {recent.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs uppercase tracking-wide">
            Recently edited
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {recent.map((n) => (
              <NoteCardSmall key={n.id} note={n} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-muted-foreground text-xs uppercase tracking-wide">
          {params.pin ? "Filtered" : "All notes"}
        </h2>
        {rows.length === 0 ? (
          <EmptyState query={params.q} />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((n) => (
              <NoteRow key={n.id} note={n} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NoteCardSmall({ note }: { note: NoteSummary }) {
  return (
    <Link
      href={openHref(note)}
      className="border-border/60 bg-card hover:border-border block rounded-xl border p-3 transition-colors"
    >
      <div className="flex items-center gap-1">
        <Pin
          className={cn(
            "size-3",
            note.pinKind ? "text-primary" : "text-muted-foreground",
          )}
        />
        <p className="truncate text-xs font-medium">{note.title}</p>
      </div>
      {note.preview ? (
        <p className="text-muted-foreground mt-1 line-clamp-2 text-[11px]">
          {note.preview}
        </p>
      ) : null}
    </Link>
  );
}

function NoteRow({ note }: { note: NoteSummary }) {
  const isPinned = note.pinKind && note.pinId;
  return (
    <li className="border-border/60 bg-card hover:border-border flex items-start gap-3 rounded-xl border p-3 transition-colors">
      <div className="flex shrink-0 flex-col items-center pt-0.5">
        {isPinned ? (
          <EntityKindIcon
            kind={note.pinKind as EntityKind}
            className="text-primary size-4"
          />
        ) : (
          <Pencil className="text-muted-foreground size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-sm font-medium tracking-tight">
            {note.title}
          </h3>
          {isPinned && note.pinTitle ? (
            <span className="text-muted-foreground truncate text-[10px] uppercase tracking-wide">
              · {note.pinTitle}
            </span>
          ) : null}
          <span className="text-muted-foreground ml-auto shrink-0 text-[10px]">
            {short(note.updatedAt)}
          </span>
        </div>
        {note.preview ? (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {note.preview}
          </p>
        ) : null}
        <div className="mt-2 flex gap-1">
          <Button asChild size="xs" variant={isPinned ? "default" : "outline"}>
            <Link href={openHref(note)}>
              {isPinned ? <ExternalLink className="size-3" /> : null}
              {isPinned ? "Open ↗" : "Open"}
            </Link>
          </Button>
          <Button asChild size="xs" variant="ghost">
            <Link href={`/notes/${note.id}`}>Editor</Link>
          </Button>
        </div>
      </div>
    </li>
  );
}

function openHref(note: NoteSummary): string {
  if (note.pinKind && note.pinId) {
    const dossier = ENTITY_HREF[note.pinKind](note.pinId);
    return `${dossier}?notes=split&note=${encodeURIComponent(note.id)}`;
  }
  return `/notes/${note.id}`;
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
      <Pencil className="text-muted-foreground size-7" />
      <p className="text-base font-medium">
        {query ? "No matches" : "Capture your first thought"}
      </p>
      <p className="text-muted-foreground text-sm">
        {query
          ? "Try a different search or pick a filter pill above."
          : "Hit Note on any dossier or use the New freeform button above."}
      </p>
    </div>
  );
}

function short(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
