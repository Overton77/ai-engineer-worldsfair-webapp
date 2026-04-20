"use client";

import { ArrowRight, Bookmark, Clock, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  ENTITY_KINDS,
  type EntityKind,
} from "@/lib/schema/entity-kind";
import { ENTITY_HREF } from "@/types/domain";
import { searchPaletteAction, type PaletteHit } from "@/app/actions/palette";

import {
  EntityKindIcon,
  entityKindLabel,
} from "../explore/entity-kind-chip";
import { useCommandPalette } from "./command-palette-context";
import {
  clearRecentSearches,
  loadRecentSearches,
  pushRecentSearch,
} from "./recent-searches";

/** Kinds users would actually want to filter to in cmd-K. Excludes
 *  things like `image`/`attempt` that aren't meaningful jump targets. */
const KIND_FILTERS: readonly EntityKind[] = [
  "person",
  "organization",
  "library",
  "paper",
  "session",
  "youtube_video",
  "event",
  "news_item",
  "course",
  "challenge",
  "notes",
];

type KindFilter = EntityKind | "all";

const HEADERS: Partial<Record<EntityKind, string>> = {
  person: "People",
  organization: "Organizations",
  library: "Libraries",
  paper: "Papers",
  session: "Talks",
  youtube_video: "Videos",
  event: "Events",
  news_item: "News",
  course: "Courses",
  course_module: "Modules",
  challenge: "Challenges",
  notes: "Your notes",
  product: "Products",
  repo: "Repos",
  report: "Reports",
  image: "Images",
  attempt: "Attempts",
};

function groupByKind(rows: PaletteHit[]): Array<[EntityKind, PaletteHit[]]> {
  const map = new Map<EntityKind, PaletteHit[]>();
  for (const row of rows) {
    const list = map.get(row.kind) ?? [];
    list.push(row);
    map.set(row.kind, list);
  }
  // preserve declared kind order, then stragglers
  const out: Array<[EntityKind, PaletteHit[]]> = [];
  for (const k of ENTITY_KINDS) {
    const list = map.get(k);
    if (list && list.length > 0) out.push([k, list]);
  }
  return out;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [hits, setHits] = React.useState<PaletteHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const reqIdRef = React.useRef(0);

  React.useEffect(() => {
    if (open) setRecent(loadRecentSearches());
  }, [open]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqIdRef.current;
    searchPaletteAction({
      prefix: debounced,
      kinds: kind === "all" ? undefined : [kind],
      limit: 18,
    })
      .then((rows) => {
        if (id !== reqIdRef.current) return;
        setHits(rows);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== reqIdRef.current) return;
        console.warn("palette search failed:", err);
        setHits([]);
        setLoading(false);
      });
  }, [debounced, kind, open]);

  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setHits([]);
    setKind("all");
  }, [setOpen]);

  const navigate = React.useCallback(
    (hit: PaletteHit) => {
      pushRecentSearch(query.trim());
      const slugOrId = hit.slug ?? hit.id;
      const href = ENTITY_HREF[hit.kind](slugOrId);
      router.push(href);
      close();
    },
    [router, query, close],
  );

  const grouped = React.useMemo(() => groupByKind(hits), [hits]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} showClose={false}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search anything…"
      />
      <KindChipRow active={kind} onChange={setKind} />
      <CommandList>
        {!debounced ? (
          <RecentList
            recent={recent}
            onPick={(q) => setQuery(q)}
            onClear={() => {
              clearRecentSearches();
              setRecent([]);
            }}
          />
        ) : loading && hits.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            Searching…
          </div>
        ) : (
          <>
            <CommandEmpty>
              No matches. Try searching for talks, libraries, people…
            </CommandEmpty>
            {grouped.map(([k, rows]) => (
              <CommandGroup key={k} heading={HEADERS[k] ?? entityKindLabel(k)}>
                {rows.map((hit) => (
                  <CommandItem
                    key={`${hit.kind}:${hit.id}`}
                    value={`${hit.kind}::${hit.id}::${hit.title}`}
                    onSelect={() => navigate(hit)}
                  >
                    <EntityKindIcon
                      kind={hit.kind}
                      className="text-muted-foreground"
                    />
                    <span className="flex-1 truncate">{hit.title}</span>
                    <span className="text-muted-foreground text-[10px] font-mono tabular-nums">
                      {hit.similarity.toFixed(2)}
                    </span>
                    <RowQuickActions hit={hit} />
                    <CommandShortcut>
                      <ArrowRight className="size-3" />
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {grouped.length === 0 && !loading ? null : (
              <CommandSeparator />
            )}
          </>
        )}
      </CommandList>
      <PaletteFooter />
    </CommandDialog>
  );
}

function KindChipRow({
  active,
  onChange,
}: {
  active: KindFilter;
  onChange: (next: KindFilter) => void;
}) {
  return (
    <div className="border-border/60 flex items-center gap-1 overflow-x-auto border-b px-3 py-2 text-xs">
      <Chip selected={active === "all"} onClick={() => onChange("all")}>
        All
      </Chip>
      {KIND_FILTERS.map((k) => (
        <Chip
          key={k}
          selected={active === k}
          onClick={() => onChange(active === k ? "all" : k)}
        >
          <EntityKindIcon kind={k} className="size-3" />
          {entityKindLabel(k)}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "border-primary bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5"
          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5"
      }
    >
      {children}
    </button>
  );
}

function RowQuickActions({ hit }: { hit: PaletteHit }) {
  const guard = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <span className="flex items-center gap-0.5">
      <button
        type="button"
        onMouseDown={guard}
        onClick={(e) => {
          guard(e);
          toast.message("Save coming soon", {
            description: `Save / follow / note ship in M3. (${hit.title})`,
          });
        }}
        className="text-muted-foreground hover:text-foreground rounded p-0.5"
        aria-label={`Save ${hit.title}`}
      >
        <Bookmark className="size-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={guard}
        onClick={(e) => {
          guard(e);
          toast.message("Note coming soon", {
            description: `Notes editor ships in M3. (${hit.title})`,
          });
        }}
        className="text-muted-foreground hover:text-foreground rounded p-0.5"
        aria-label={`Note about ${hit.title}`}
      >
        <Pencil className="size-3.5" />
      </button>
    </span>
  );
}

function RecentList({
  recent,
  onPick,
  onClear,
}: {
  recent: string[];
  onPick: (q: string) => void;
  onClear: () => void;
}) {
  if (recent.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-foreground text-sm">
          Try searching for talks, libraries, people&hellip;
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Type to search across all 26 categories of the corpus.
        </p>
      </div>
    );
  }
  return (
    <CommandGroup heading="Recent searches">
      {recent.map((q) => (
        <CommandItem key={q} value={`recent::${q}`} onSelect={() => onPick(q)}>
          <Clock className="text-muted-foreground" />
          <span className="flex-1 truncate">{q}</span>
          <CommandShortcut>↵</CommandShortcut>
        </CommandItem>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-1 px-2 py-1.5 text-[11px]"
      >
        <X className="size-3" /> Clear recent
      </button>
    </CommandGroup>
  );
}

function PaletteFooter() {
  return (
    <div className="border-border/60 text-muted-foreground flex items-center justify-between gap-3 border-t px-3 py-2 text-[10px]">
      <span className="inline-flex items-center gap-1">
        <kbd className="bg-muted rounded px-1 py-0.5 font-mono">↑</kbd>
        <kbd className="bg-muted rounded px-1 py-0.5 font-mono">↓</kbd>
        <span>navigate</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <kbd className="bg-muted rounded px-1 py-0.5 font-mono">↵</kbd>
        <span>open</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <kbd className="bg-muted rounded px-1 py-0.5 font-mono">esc</kbd>
        <span>close</span>
      </span>
    </div>
  );
}
