import { z } from "zod";

import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";

/**
 * Loose Tiptap doc shape. We do NOT round-trip the doc through a
 * strict Zod schema — Tiptap's own json export is the source of truth
 * for editor state. We just validate the **outer envelope** so the
 * autosave Server Action can reject obvious junk before it hits the
 * DB.
 */
export const NoteDocNodeSchema: z.ZodType<NoteDocNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.any()).optional(),
    content: z.array(NoteDocNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(z.any()).optional(),
  }),
);

export type NoteDocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoteDocNode[];
  text?: string;
  marks?: unknown[];
};

export const NoteDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(NoteDocNodeSchema).optional(),
});

export type NoteDoc = z.infer<typeof NoteDocSchema>;

/**
 * Empty doc helper — every fresh note starts here so the editor has a
 * valid `{type:'doc', content:[{type:'paragraph'}]}` to render.
 */
export function emptyDoc(): NoteDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

// ─── Mention attrs (typed wrappers used by the editor) ──────────

export const EntityMentionAttrsSchema = z.object({
  kind: z.enum(ENTITY_KINDS),
  id: z.string().min(1),
  slug: z.string().nullable().optional(),
  title: z.string().min(1),
});
export type EntityMentionAttrs = z.infer<typeof EntityMentionAttrsSchema>;

export const TimestampMentionAttrsSchema = z.object({
  videoId: z.string().min(1),
  seconds: z.number().int().nonnegative(),
});
export type TimestampMentionAttrs = z.infer<
  typeof TimestampMentionAttrsSchema
>;

export const ENTITY_MENTION_NODE = "entityMention" as const;
export const TIMESTAMP_MENTION_NODE = "timestampMention" as const;

// ─── Pinned-entity ref shape used by the autosave action ────────

export const NotePinSchema = z.object({
  kind: z.enum(ENTITY_KINDS),
  id: z.string().min(1),
  /** Denormalised onto notes.entity_title for fast list rendering. */
  title: z.string().min(1).max(280),
});
export type NotePin = z.infer<typeof NotePinSchema>;

// ─── DTO for the row the UI consumes ────────────────────────────

export type NoteSummary = {
  id: string;
  title: string;
  /** Excerpt from content_text for the list-row preview. */
  preview: string;
  pinKind: EntityKind | null;
  pinId: string | null;
  pinTitle: string | null;
  updatedAt: string;
  createdAt: string;
};

export function asNoteSummary(row: {
  id: string;
  title: string;
  content_text: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_title: string | null;
  updated_at: string;
  created_at: string;
}): NoteSummary {
  const trimmed = row.content_text.trim().replace(/\s+/g, " ");
  return {
    id: row.id,
    title: row.title,
    preview: trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed,
    pinKind: (row.entity_type as EntityKind | null) ?? null,
    pinId: row.entity_id,
    pinTitle: row.entity_title,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}
