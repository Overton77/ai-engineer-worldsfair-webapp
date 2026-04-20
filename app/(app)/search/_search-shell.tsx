"use client";

import { Bot } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import * as React from "react";
import { toast } from "sonner";

import {
  EntityKindIcon,
  entityKindLabel,
} from "@/components/explore/entity-kind-chip";
import {
  MatchModeToggle,
  type MatchMode,
} from "@/components/explore/match-mode-toggle";
import { ResultList } from "@/components/explore/result-list";
import { SearchInput } from "@/components/explore/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ENTITY_KINDS,
  type EntityKind,
} from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";
import { ENTITY_HREF } from "@/types/domain";
import {
  searchAllAction,
  searchChunksAction,
} from "@/app/actions/search";

type LexicalHit = Awaited<ReturnType<typeof searchAllAction>>[number];
type ChunkHit = Awaited<ReturnType<typeof searchChunksAction>>[number];

const MODES: readonly MatchMode[] = ["lexical", "semantic", "hybrid"];

const TAB_KINDS: readonly EntityKind[] = [
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

type SearchShellProps = {
  initialQuery: string;
  initialMode: MatchMode;
  initialKinds: EntityKind[];
  initialLexical: LexicalHit[];
  initialChunks: ChunkHit[];
};

export function SearchShell({
  initialQuery,
  initialMode,
  initialKinds,
  initialLexical,
  initialChunks,
}: SearchShellProps) {
  const [params, setParams] = useQueryStates({
    q: parseAsString.withDefault(initialQuery),
    mode: parseAsStringLiteral(MODES).withDefault(initialMode),
    kinds: parseAsArrayOf(parseAsString).withDefault(initialKinds),
  });

  const [lexical, setLexical] = React.useState<LexicalHit[]>(initialLexical);
  const [chunks, setChunks] = React.useState<ChunkHit[]>(initialChunks);
  const [loading, setLoading] = React.useState(false);
  const reqIdRef = React.useRef(0);
  const initialKey = React.useRef<string>(
    JSON.stringify({
      q: initialQuery,
      mode: initialMode,
      kinds: initialKinds,
    }),
  );

  const trimmed = params.q.trim();
  const validKinds = React.useMemo(
    () =>
      params.kinds.filter((k): k is EntityKind =>
        ENTITY_KINDS.includes(k as EntityKind),
      ),
    [params.kinds],
  );

  React.useEffect(() => {
    const key = JSON.stringify({
      q: trimmed,
      mode: params.mode,
      kinds: validKinds,
    });
    if (key === initialKey.current) {
      // Don't refetch on first mount — server already shipped data.
      return;
    }
    initialKey.current = "";
    if (!trimmed) {
      setLexical([]);
      setChunks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqIdRef.current;
    const lexicalP =
      params.mode === "lexical"
        ? searchAllAction({
            query: trimmed,
            kinds: validKinds.length > 0 ? validKinds : undefined,
            limit: 40,
          })
        : Promise.resolve([] as LexicalHit[]);
    const chunkP =
      params.mode === "lexical"
        ? Promise.resolve([] as ChunkHit[])
        : searchChunksAction({
            query: trimmed,
            mode: params.mode,
            matchCount: 24,
          });
    Promise.all([lexicalP, chunkP])
      .then(([lex, chk]) => {
        if (id !== reqIdRef.current) return;
        setLexical(lex);
        setChunks(chk);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== reqIdRef.current) return;
        console.warn("search failed:", err);
        setLexical([]);
        setChunks([]);
        setLoading(false);
      });
  }, [trimmed, params.mode, validKinds]);

  const setMode = (mode: MatchMode) => setParams({ mode });
  const setKinds = (kinds: EntityKind[]) => setParams({ kinds });

  const lexCounts = React.useMemo(() => {
    const counts = new Map<EntityKind, number>();
    for (const row of lexical) counts.set(row.entity_kind, (counts.get(row.entity_kind) ?? 0) + 1);
    return counts;
  }, [lexical]);

  const totalLex = lexical.length;
  const totalChunks = chunks.length;

  const isEmpty = trimmed.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <SearchInput
          value={params.q}
          onChangeValue={(next) => setParams({ q: next })}
          placeholder="GEPA evaluations, llm-as-judge, agenta…"
          ariaLabel="Search the corpus"
        />
        <div className="flex flex-wrap items-center gap-2">
          <MatchModeToggle
            value={params.mode}
            onChange={setMode}
            available={["lexical", "semantic", "hybrid"]}
          />
          <span className="text-muted-foreground text-xs">
            {params.mode === "lexical"
              ? "Find people, libraries, papers, talks, and more by name."
              : params.mode === "semantic"
                ? "Find passages from talks, papers, and modules that match the idea."
                : "Find anything across the corpus — names and ideas combined."}
          </span>
        </div>
      </header>

      {isEmpty ? (
        <EmptyHint />
      ) : params.mode === "lexical" ? (
        <LexicalView
          rows={lexical}
          loading={loading}
          counts={lexCounts}
          total={totalLex}
          activeKinds={validKinds}
          onChangeKinds={setKinds}
        />
      ) : (
        <ChunkView rows={chunks} loading={loading} mode={params.mode} />
      )}

      {!isEmpty ? (
        <AskAICta
          query={trimmed}
          counts={params.mode === "lexical" ? totalLex : totalChunks}
        />
      ) : null}
    </div>
  );
}

function LexicalView({
  rows,
  loading,
  counts,
  total,
  activeKinds,
  onChangeKinds,
}: {
  rows: LexicalHit[];
  loading: boolean;
  counts: Map<EntityKind, number>;
  total: number;
  activeKinds: EntityKind[];
  onChangeKinds: (kinds: EntityKind[]) => void;
}) {
  const filtered = React.useMemo(() => {
    if (activeKinds.length === 0) return rows;
    const set = new Set(activeKinds);
    return rows.filter((r) => set.has(r.entity_kind));
  }, [rows, activeKinds]);

  return (
    <div className="flex flex-col gap-4">
      <KindTabs
        counts={counts}
        total={total}
        active={activeKinds}
        onChange={onChangeKinds}
      />
      <ResultList
        rows={filtered.map((r) => ({
          entity: {
            kind: r.entity_kind,
            id: r.entity_id,
            slug: r.slug,
            title: r.title,
            subtitle: r.subtitle,
            description: null,
            imageUrl: r.image_url ?? null,
            href: ENTITY_HREF[r.entity_kind](r.slug ?? r.entity_id),
          },
          snippet: r.snippet,
        }))}
        total={filtered.length}
        loading={loading}
        emptyTitle="No exact matches"
        emptyDescription="Try Hybrid mode or broaden your query."
      />
    </div>
  );
}

function ChunkView({
  rows,
  loading,
}: {
  rows: ChunkHit[];
  loading: boolean;
  mode: "semantic" | "hybrid";
}) {
  const groups = React.useMemo(() => groupChunks(rows), [rows]);
  if (loading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
        <p className="text-base font-medium">No passages matched</p>
        <p className="text-muted-foreground text-sm">
          Try the &ldquo;By name&rdquo; mode or refine your query.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-xs">
        {rows.length} passages from {groups.length} sources
      </p>
      {groups.map((g) => (
        <ChunkGroupCard key={g.key} group={g} />
      ))}
    </div>
  );
}

type ChunkGroup = {
  key: string;
  sourceKind: ChunkHit["sourceKind"];
  sourceId: string;
  topScore: number;
  hits: ChunkHit[];
};

function groupChunks(rows: ChunkHit[]): ChunkGroup[] {
  const map = new Map<string, ChunkGroup>();
  for (const r of rows) {
    const key = `${r.sourceKind}:${r.sourceId}`;
    const existing = map.get(key);
    if (existing) {
      existing.hits.push(r);
      existing.topScore = Math.max(existing.topScore, r.rrfScore);
    } else {
      map.set(key, {
        key,
        sourceKind: r.sourceKind,
        sourceId: r.sourceId,
        topScore: r.rrfScore,
        hits: [r],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.topScore - a.topScore);
}

function ChunkGroupCard({ group }: { group: ChunkGroup }) {
  const target = sourceTarget(group.sourceKind, group.sourceId);
  return (
    <article className="border-border/60 bg-card flex flex-col gap-2 rounded-xl border p-4">
      <header className="flex items-center justify-between gap-2">
        <a
          href={target.href}
          className="hover:underline focus-visible:outline-none focus-visible:underline"
        >
          <span className="text-foreground text-sm font-medium">
            {target.kindLabel}
          </span>
        </a>
      </header>
      <ul className="flex flex-col gap-2">
        {group.hits.slice(0, 3).map((hit) => (
          <li
            key={hit.chunkId}
            className="border-border/40 bg-background/40 rounded-lg border p-2 text-sm"
          >
            <p className="text-foreground/90 line-clamp-3 text-sm leading-snug">
              {hit.content}
            </p>
          </li>
        ))}
      </ul>
      {group.hits.length > 3 ? (
        <p className="text-muted-foreground text-[11px]">
          +{group.hits.length - 3} more passages from this source
        </p>
      ) : null}
    </article>
  );
}

/**
 * Map a chunk's source pointer to a navigable URL + display label.
 * Mirrors `chunk_source_kind` → entity routing.
 */
function sourceTarget(kind: ChunkHit["sourceKind"], id: string): {
  href: string;
  label: string;
  kindLabel: string;
} {
  if (
    kind === "video_summary" ||
    kind === "video_transcript_segment" ||
    kind === "video_description" ||
    kind === "video_chapter"
  ) {
    return {
      href: ENTITY_HREF.youtube_video(id),
      label: "Video",
      kindLabel: "Video",
    };
  }
  if (kind === "session_description") {
    return {
      href: ENTITY_HREF.session(id),
      label: "Talk",
      kindLabel: "Talk",
    };
  }
  if (kind === "paper_abstract" || kind === "paper_section") {
    return {
      href: ENTITY_HREF.paper(id),
      label: "Paper",
      kindLabel: "Paper",
    };
  }
  if (kind === "module_body") {
    return {
      href: ENTITY_HREF.course_module(id),
      label: "Course module",
      kindLabel: "Module",
    };
  }
  if (kind === "report_section") {
    return {
      href: ENTITY_HREF.report(id),
      label: "Report",
      kindLabel: "Report",
    };
  }
  if (kind === "news_item_body") {
    return {
      href: ENTITY_HREF.news_item(id),
      label: "News item",
      kindLabel: "News",
    };
  }
  if (kind === "repo_readme" || kind === "repo_example" || kind === "repo_doc") {
    return {
      href: ENTITY_HREF.repo(id),
      label: "Repo",
      kindLabel: "Repo",
    };
  }
  if (kind === "dossier") {
    return {
      href: ENTITY_HREF.library(id),
      label: "Library dossier",
      kindLabel: "Library",
    };
  }
  // doc_page / slide / custom
  return {
    href: "#",
    label: "Source chunk",
    kindLabel: kind,
  };
}

function KindTabs({
  counts,
  total,
  active,
  onChange,
}: {
  counts: Map<EntityKind, number>;
  total: number;
  active: EntityKind[];
  onChange: (next: EntityKind[]) => void;
}) {
  const allActive = active.length === 0;
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        role="tab"
        aria-selected={allActive}
        onClick={() => onChange([])}
        className={cn(
          "rounded-full border px-3 py-1 text-sm transition-colors",
          allActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
        )}
      >
        All ({total})
      </button>
      {TAB_KINDS.map((k) => {
        const count = counts.get(k) ?? 0;
        if (count === 0) return null;
        const isActive = active.includes(k);
        return (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() =>
              onChange(isActive ? active.filter((x) => x !== k) : [...active, k])
            }
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <EntityKindIcon kind={k} className="size-3" />
            {entityKindLabel(k)} ({count})
          </button>
        );
      })}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-3 rounded-xl border p-12 text-center">
      <p className="text-base font-medium">Search the AI engineering corpus</p>
      <p className="text-muted-foreground max-w-md text-sm">
        Find people, libraries, papers, talks, videos, and the passages
        inside them.
      </p>
      <p className="text-muted-foreground text-xs">
        Try{" "}
        <SuggestionChips suggestions={["llm as judge", "agentic rag", "GEPA"]} />
      </p>
    </div>
  );
}

function SuggestionChips({ suggestions }: { suggestions: string[] }) {
  const [, setParams] = useQueryStates({
    q: parseAsString.withDefault(""),
  });
  return (
    <span className="inline-flex flex-wrap items-center gap-1 align-middle">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setParams({ q: s })}
          className="border-border bg-background hover:bg-muted rounded-full border px-2 py-0.5 text-[11px]"
        >
          {s}
        </button>
      ))}
    </span>
  );
}

function AskAICta({ query, counts }: { query: string; counts: number }) {
  const noResults = counts === 0;
  return (
    <div
      className={cn(
        "border-border/60 flex flex-col items-start gap-2 rounded-xl border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div>
        <p className="text-sm font-medium">
          {noResults ? "No exact matches?" : "Want a synthesis?"}
        </p>
        <p className="text-muted-foreground text-xs">
          The assistant ships in M4. For now this opens a placeholder.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          toast.message("Assistant coming soon", {
            description: `M4 will route ${JSON.stringify(query)} to the assistant.`,
          })
        }
      >
        <Bot className="size-3.5" />
        Ask the AI assistant
      </Button>
    </div>
  );
}
