import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";
import { matchChunks } from "@/lib/search/matchChunks";
import { searchAll } from "@/lib/search/searchAll";

import { SearchShell } from "./_search-shell";
import type { MatchMode } from "@/components/explore/match-mode-toggle";

export const metadata = { title: "Search" };

const MODES: readonly MatchMode[] = ["lexical", "semantic", "hybrid"];

function parseMode(raw: unknown): MatchMode {
  if (typeof raw === "string" && (MODES as readonly string[]).includes(raw)) {
    return raw as MatchMode;
  }
  return "hybrid";
}

function parseKinds(raw: unknown): EntityKind[] {
  if (typeof raw !== "string") return [];
  const set = new Set<string>(ENTITY_KINDS);
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => set.has(s)) as EntityKind[];
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const mode = parseMode(params.mode);
  const kinds = parseKinds(params.kinds);

  const trimmed = q.trim();
  const hasQuery = trimmed.length > 0;

  const [lexical, chunks] = await Promise.all([
    hasQuery && mode === "lexical"
      ? searchAll({
          query: trimmed,
          kinds: kinds.length > 0 ? kinds : undefined,
          limit: 40,
        }).catch(() => [])
      : Promise.resolve([]),
    hasQuery && mode !== "lexical"
      ? matchChunks({
          query: trimmed,
          options: {
            matchCount: 24,
            semanticWeight: 1,
            fullTextWeight: mode === "semantic" ? 0 : 1,
          },
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <SearchShell
        initialQuery={q}
        initialMode={mode}
        initialKinds={kinds}
        initialLexical={lexical}
        initialChunks={chunks}
      />
    </div>
  );
}
