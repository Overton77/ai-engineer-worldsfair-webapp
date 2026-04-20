"use server";

import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import {
  createEmptyNote,
  getNoteById,
  listNotesForEntity,
} from "@/lib/db/notes";
import { resolveEntitySummariesByRefs } from "@/lib/db/resolve-entity-summary";
import { EntityKindSchema } from "@/lib/schema/entity-kind";
import {
  asNoteSummary,
  type NoteDoc,
  type NoteSummary,
} from "@/lib/notes/types";
import type { EntitySummary } from "@/types/domain";

const ArgsSchema = z.union([
  z.object({
    mode: z.literal("existing"),
    noteId: z.string().uuid(),
  }),
  z.object({
    mode: z.literal("new"),
    pinTo: z.object({
      kind: EntityKindSchema,
      id: z.string().min(1),
    }),
  }),
]);

export type DrawerBootstrap = {
  ok: true;
  noteId: string;
  title: string;
  contentJson: NoteDoc;
  pin: { kind: string; id: string; title: string } | null;
  entity: EntitySummary | null;
  notes: NoteSummary[];
} | { ok: false; error: string };

/**
 * Single Server Action that bootstraps the entire N1 drawer state in
 * one round trip:
 *
 *  - Resolves the entity strip (title, subtitle, image, href).
 *  - For an existing note: loads the note row.
 *  - For a new note: creates an empty note pinned to the ref so the
 *    editor has a real id from the first keystroke.
 *  - Returns the up-to-date list of notes pinned to that entity.
 */
export async function bootstrapDrawerAction(
  input: z.input<typeof ArgsSchema>,
): Promise<DrawerBootstrap> {
  const parsed = ArgsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid arguments" };
  const user = await requireUser();

  if (parsed.data.mode === "existing") {
    const row = await getNoteById(parsed.data.noteId, user.id);
    if (!row) return { ok: false, error: "Note not found" };

    let entity: EntitySummary | null = null;
    if (row.entity_type && row.entity_id) {
      const summaries = await resolveEntitySummariesByRefs([
        { kind: row.entity_type as never, id: row.entity_id },
      ]);
      entity = summaries.get(`${row.entity_type}:${row.entity_id}`) ?? null;
    }

    const notes = entity
      ? await listNotesForEntity({
          userId: user.id,
          kind: row.entity_type as never,
          id: row.entity_id as string,
        })
      : [asNoteSummary(row)];

    return {
      ok: true,
      noteId: row.id,
      title: row.title,
      contentJson: (row.content_json as unknown as NoteDoc) ?? {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
      pin:
        row.entity_type && row.entity_id
          ? {
              kind: row.entity_type,
              id: row.entity_id,
              title: row.entity_title ?? "Untitled",
            }
          : null,
      entity,
      notes,
    };
  }

  // mode === 'new'
  const summaries = await resolveEntitySummariesByRefs([parsed.data.pinTo]);
  const entity = summaries.get(
    `${parsed.data.pinTo.kind}:${parsed.data.pinTo.id}`,
  );
  if (!entity) return { ok: false, error: "Entity not found" };

  const row = await createEmptyNote({
    userId: user.id,
    pin: {
      kind: parsed.data.pinTo.kind,
      id: parsed.data.pinTo.id,
      title: entity.title,
    },
    title: "Untitled",
  });
  if (!row) return { ok: false, error: "Failed to create note" };

  const notes = await listNotesForEntity({
    userId: user.id,
    kind: parsed.data.pinTo.kind,
    id: parsed.data.pinTo.id,
  });

  return {
    ok: true,
    noteId: row.id,
    title: row.title,
    contentJson: (row.content_json as unknown as NoteDoc) ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    pin: {
      kind: parsed.data.pinTo.kind,
      id: parsed.data.pinTo.id,
      title: entity.title,
    },
    entity,
    notes,
  };
}
