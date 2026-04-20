"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import {
  createEmptyNote,
  deleteNote,
  listNotesForEntity,
  upsertNote,
} from "@/lib/db/notes";
import { EntityKindSchema } from "@/lib/schema/entity-kind";
import {
  NoteDocSchema,
  NotePinSchema,
  type NoteSummary,
} from "@/lib/notes/types";

// ─── Schemas ────────────────────────────────────────────────────

const CreateNoteSchema = z.object({
  pin: NotePinSchema.optional().nullable(),
  title: z.string().trim().max(280).optional(),
});

const AutosaveSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(280).optional(),
  contentJson: NoteDocSchema,
  pin: NotePinSchema.optional().nullable(),
});

const DeleteSchema = z.object({ id: z.string().uuid() });

const ListForEntitySchema = z.object({
  kind: EntityKindSchema,
  id: z.string().min(1),
  limit: z.number().int().positive().max(50).optional(),
});

// ─── Result types ───────────────────────────────────────────────

export type CreateNoteResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type AutosaveNoteResult =
  | { ok: true; id: string; updatedAt: string; preview: string }
  | { ok: false; error: string };

export type DeleteNoteResult = { ok: true } | { ok: false; error: string };

export type ListNotesForEntityResult = {
  ok: true;
  rows: NoteSummary[];
};

// ─── Actions ────────────────────────────────────────────────────

export async function createNoteAction(
  input: z.input<typeof CreateNoteSchema>,
): Promise<CreateNoteResult> {
  const parsed = CreateNoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid arguments" };
  const user = await requireUser();
  const row = await createEmptyNote({
    userId: user.id,
    pin: parsed.data.pin ?? null,
    title: parsed.data.title,
  });
  if (!row) return { ok: false, error: "Failed to create note" };
  revalidatePath("/notes");
  return { ok: true, id: row.id };
}

export async function autosaveNoteAction(
  input: z.input<typeof AutosaveSchema>,
): Promise<AutosaveNoteResult> {
  const parsed = AutosaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const user = await requireUser();
  const row = await upsertNote({
    id: parsed.data.id,
    user_id: user.id,
    title: parsed.data.title,
    contentJson: parsed.data.contentJson,
    pin: parsed.data.pin ?? null,
  });
  if (!row) return { ok: false, error: "Failed to autosave" };
  // We deliberately DO NOT revalidatePath('/notes') on every keystroke
  // — that would invalidate caches several times per second. The
  // /notes page can refresh on next navigation; the drawer / split
  // surfaces optimistically update locally.
  return {
    ok: true,
    id: row.id,
    updatedAt: row.updated_at,
    preview:
      row.content_text.length > 200
        ? `${row.content_text.slice(0, 200)}…`
        : row.content_text,
  };
}

export async function deleteNoteAction(
  input: z.input<typeof DeleteSchema>,
): Promise<DeleteNoteResult> {
  const parsed = DeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid id" };
  const user = await requireUser();
  const ok = await deleteNote(parsed.data.id, user.id);
  if (!ok) return { ok: false, error: "Failed to delete" };
  revalidatePath("/notes");
  return { ok: true };
}

export async function listNotesForEntityAction(
  input: z.input<typeof ListForEntitySchema>,
): Promise<ListNotesForEntityResult> {
  const parsed = ListForEntitySchema.safeParse(input);
  if (!parsed.success) return { ok: true, rows: [] };
  const user = await requireUser();
  const rows = await listNotesForEntity({
    userId: user.id,
    kind: parsed.data.kind,
    id: parsed.data.id,
    limit: parsed.data.limit,
  });
  return { ok: true, rows };
}
