/**
 * Batch-resolve a small page of polymorphic entity refs into the
 * normalised <EntitySummary> shape. Used by `/follows` (which stores
 * just kind+id and needs to render titles + images on the row).
 *
 * Synthetic kinds (`category`, `domain_layer`) are short-circuited
 * locally — they don't have backing rows.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  type CategoryKey,
} from "@/lib/schema/taxonomy";
import type {
  EntityKind,
  FollowEntityKind,
} from "@/lib/schema/entity-kind";
import type { Database } from "@/types/database.types";
import { ENTITY_HREF, type EntitySummary } from "@/types/domain";

import { toEntitySummary } from "./entity-summary";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? (await createServerSupabase());
}

type Ref = { kind: FollowEntityKind; id: string };

const KIND_TO_TABLE_AND_FIELD: Partial<
  Record<EntityKind, { table: keyof Database["public"]["Tables"]; field: string }>
> = {
  person: { table: "person", field: "person_id" },
  organization: { table: "organization", field: "organization_id" },
  session: { table: "session", field: "session_id" },
  youtube_video: { table: "youtube_video", field: "video_id" },
  library: { table: "library", field: "slug" },
  paper: { table: "paper", field: "slug" },
  event: { table: "event", field: "event_id" },
  product: { table: "product", field: "slug" },
  repo: { table: "repo", field: "repo_id" },
  course: { table: "course", field: "slug" },
  course_module: { table: "course_module", field: "slug" },
  challenge: { table: "challenge", field: "slug" },
  news_item: { table: "news_item", field: "news_item_id" },
  report: { table: "report", field: "report_id" },
};

/**
 * Returns a Map keyed by `"<kind>:<id>"` → resolved EntitySummary.
 * Missing rows are dropped silently — the caller decides how to
 * render a follow whose entity has been removed (we render a faded
 * "Untitled" stub).
 */
export async function resolveEntitySummariesByRefs(
  refs: ReadonlyArray<Ref>,
  client?: Client,
): Promise<Map<string, EntitySummary>> {
  if (refs.length === 0) return new Map();
  const sb = await getClient(client);
  const out = new Map<string, EntitySummary>();

  // Synthetic kinds short-circuit
  for (const r of refs) {
    if (r.kind === "category") {
      const id = r.id as CategoryKey;
      const label = CATEGORY_LABELS[id] ?? r.id;
      out.set(`${r.kind}:${r.id}`, {
        kind: "person", // placeholder — chip uses the title only
        id: r.id,
        slug: null,
        title: label,
        subtitle: "Category",
        href: `/explore/youtube_video?categories=${encodeURIComponent(r.id)}`,
        description: null,
        imageUrl: null,
      });
    } else if (r.kind === "domain_layer") {
      out.set(`${r.kind}:${r.id}`, {
        kind: "person",
        id: r.id,
        slug: null,
        title: r.id,
        subtitle: "Domain layer",
        href: `/explore/youtube_video?layers=${encodeURIComponent(r.id)}`,
        description: null,
        imageUrl: null,
      });
    }
  }

  // Group remaining refs by kind, then issue one IN-list query per kind
  const grouped = new Map<EntityKind, string[]>();
  for (const r of refs) {
    if (r.kind === "category" || r.kind === "domain_layer") continue;
    const arr = grouped.get(r.kind) ?? [];
    arr.push(r.id);
    grouped.set(r.kind, arr);
  }

  await Promise.all(
    Array.from(grouped.entries()).map(async ([kind, ids]) => {
      const meta = KIND_TO_TABLE_AND_FIELD[kind];
      if (!meta) return;
      const { data, error } = await sb
        // Cast through unknown so the dynamic-table call typechecks.
        .from(meta.table as never)
        .select("*")
        .in(meta.field, ids);
      if (error) {
        console.warn(`resolveEntitySummariesByRefs(${kind}): ${error.message}`);
        return;
      }
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const id = row[meta.field];
        if (typeof id !== "string") continue;
        const summary = toEntitySummary(kind, row);
        // Force the EntitySummary `id` to the value we matched on so
        // the key on the calling side stays consistent.
        out.set(`${kind}:${id}`, {
          ...summary,
          id,
          href:
            summary.href ||
            ENTITY_HREF[kind](summary.slug ?? id),
        });
      }
    }),
  );

  return out;
}
