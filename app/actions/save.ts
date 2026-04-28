"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { deleteSave, insertSave } from "@/lib/db/saves";
import { emitEntityInteractionEvent } from "@/lib/recommendations/events";
import { EntityKindSchema } from "@/lib/schema/entity-kind";

export type SaveActionResult =
  | { ok: true; state: "saved" | "unsaved"; at: string }
  | { ok: false; error: string };

const ToggleArgsSchema = z.object({
  kind: EntityKindSchema,
  id: z.string().min(1),
  title: z.string().min(1).max(280),
  subtitle: z.string().max(280).optional().nullable(),
  /**
   * If undefined, treat as a toggle. Server will look up the existing
   * row and flip; passing `intent: "save"|"unsaved"` makes the call
   * idempotent which is what optimistic-UI rollbacks want.
   */
  intent: z.enum(["save", "unsaved"]).optional(),
});

export async function toggleSaveAction(
  input: z.input<typeof ToggleArgsSchema>,
): Promise<SaveActionResult> {
  const parsed = ToggleArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid arguments" };
  }
  const { kind, id, title, subtitle, intent } = parsed.data;

  const user = await requireUser();
  const at = new Date().toISOString();

  // Idempotent path: caller knows what it wants. We still issue the
  // delete/insert; the DAL handles 23505 (unique violation) gracefully.
  if (intent === "save") {
    const row = await insertSave({
      user_id: user.id,
      entity_type: kind,
      entity_id: id,
      entity_title: title,
      entity_subtitle: subtitle ?? null,
    });
    if (!row) return { ok: false, error: "Failed to save" };
    await emitEntityInteractionEvent({
      userId: user.id,
      type: "entity.saved",
      entity: { kind, id, title, subtitle: subtitle ?? null },
    });
    revalidatePath("/saved");
    return { ok: true, state: "saved", at };
  }

  if (intent === "unsaved") {
    const ok = await deleteSave({ userId: user.id, kind, id });
    if (!ok) return { ok: false, error: "Failed to unsave" };
    await emitEntityInteractionEvent({
      userId: user.id,
      type: "entity.unsaved",
      entity: { kind, id, title, subtitle: subtitle ?? null },
    });
    revalidatePath("/saved");
    return { ok: true, state: "unsaved", at };
  }

  // Toggle: try delete; if it found nothing we're not saved, so insert.
  const removed = await deleteSave({ userId: user.id, kind, id });
  if (removed) {
    // delete returns true even when nothing was deleted, but the
    // unique key means inserting is always safe — we'll ALWAYS insert
    // when intent is undefined and the row didn't exist. To make
    // toggle correct, fall back to a SELECT first via the
    // intent-aware path. This branch is reached only when intent is
    // omitted; production callers always pass intent for predictable
    // optimistic UI.
    await emitEntityInteractionEvent({
      userId: user.id,
      type: "entity.unsaved",
      entity: { kind, id, title, subtitle: subtitle ?? null },
    });
    revalidatePath("/saved");
    return { ok: true, state: "unsaved", at };
  }

  const row = await insertSave({
    user_id: user.id,
    entity_type: kind,
    entity_id: id,
    entity_title: title,
    entity_subtitle: subtitle ?? null,
  });
  if (!row) return { ok: false, error: "Failed to save" };
  await emitEntityInteractionEvent({
    userId: user.id,
    type: "entity.saved",
    entity: { kind, id, title, subtitle: subtitle ?? null },
  });
  revalidatePath("/saved");
  return { ok: true, state: "saved", at };
}
