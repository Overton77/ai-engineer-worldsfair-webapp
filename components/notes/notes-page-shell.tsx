"use client";

import { ExternalLink, Loader2, Pencil, Pin, Plus, Search } from "lucide-react";
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
import type { NoteSummary } from "@/lib/notes/types";

export type NoteRowSummary = NoteSummary & { openHref: string };

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
  rows: NoteRowSummary[];
  recent: NoteRowSummary[];
  initialQuery: string;
  initialPin: string;
};

const SEARCH_DEBOUNCE_MS = 250;

export function NotesPageShell({
  rows,
  recent,
  initialQuery,
  initialPin,
}: NotesPageShellProps) {
  const router = useRouter();
  // `shallow: false` is required so changing `q` / `pin` re-runs the
  // server component and re-queries the DB. Without it the URL updated
  // but the list stayed on whatever the initial server render returned.
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(initialQuery),
      pin: parseAsString.withDefault(initialPin),
    },
    { history: "replace", shallow: false },
  );

  // Local search state drives the input; we debounce pushes to the
  // URL so a typed query doesn't fire a server round-trip on every
  // keystroke.
  const [localQ, setLocalQ] = React.useState(params.q);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setLocalQ(params.q);
  }, [params.q]);

  React.useEffect(() => {
    if (localQ === params.q) return;
    const t = setTimeout(() => {
      startTransition(() => {
        void setParams({ q: localQ });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [localQ, params.q, setParams]);

  const onPickPin = (id: string) => {
    startTransition(() => {
      void setParams({ pin: id });
    });
  };

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
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          {isPending ? (
            <Loader2 className="text-muted-foreground size-3 animate-spin" />
          ) : null}
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
            onClick={() => onPickPin(f.id)}
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

function NoteCardSmall({ note }: { note: NoteRowSummary }) {
  return (
    <Link
      href={note.openHref}
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

function NoteRow({ note }: { note: NoteRowSummary }) {
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
            <Link href={note.openHref}>
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
