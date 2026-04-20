"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { deleteFollow, insertFollow } from "@/lib/db/follows";
import { insertNotification } from "@/lib/db/notifications";
import { FollowEntityKindSchema } from "@/lib/schema/entity-kind";

export type FollowActionResult =
  | { ok: true; state: "following" | "unfollowed"; at: string }
  | { ok: false; error: string };

const ToggleArgsSchema = z.object({
  kind: FollowEntityKindSchema,
  id: z.string().min(1),
  /** Used to populate the notification body / `url` on first follow. */
  title: z.string().min(1).max(280),
  url: z.string().max(512).optional().nullable(),
  intent: z.enum(["follow", "unfollow"]).optional(),
});

export async function toggleFollowAction(
  input: z.input<typeof ToggleArgsSchema>,
): Promise<FollowActionResult> {
  const parsed = ToggleArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid arguments" };
  }
  const { kind, id, title, url, intent } = parsed.data;
  const user = await requireUser();
  const at = new Date().toISOString();

  if (intent === "follow") {
    const row = await insertFollow({
      user_id: user.id,
      entity_kind: kind,
      entity_id: id,
    });
    if (!row) return { ok: false, error: "Failed to follow" };
    await emitFollowNotification({
      userId: user.id,
      kind,
      id,
      title,
      url: url ?? null,
    });
    revalidatePath("/follows");
    return { ok: true, state: "following", at };
  }

  if (intent === "unfollow") {
    const ok = await deleteFollow({ userId: user.id, kind, id });
    if (!ok) return { ok: false, error: "Failed to unfollow" };
    revalidatePath("/follows");
    return { ok: true, state: "unfollowed", at };
  }

  // Pure toggle (no intent). delete-then-insert is best-effort; callers
  // are encouraged to pass `intent` for clean optimistic UI.
  const removed = await deleteFollow({ userId: user.id, kind, id });
  if (removed) {
    revalidatePath("/follows");
    return { ok: true, state: "unfollowed", at };
  }

  const row = await insertFollow({
    user_id: user.id,
    entity_kind: kind,
    entity_id: id,
  });
  if (!row) return { ok: false, error: "Failed to follow" };
  await emitFollowNotification({
    userId: user.id,
    kind,
    id,
    title,
    url: url ?? null,
  });
  revalidatePath("/follows");
  return { ok: true, state: "following", at };
}

async function emitFollowNotification(args: {
  userId: string;
  kind: string;
  id: string;
  title: string;
  url: string | null;
}): Promise<void> {
  // The user_id of the notification IS the follower — v1 is purely
  // "you followed X; updates will land here". When real follow-event
  // triggers ship in M4+ they'll insert with their own kind values
  // (e.g. `follow_news_item`).
  await insertNotification({
    user_id: args.userId,
    kind: "follow_created",
    title: `Following ${args.title}`,
    body: "Updates will show up here.",
    ref_kind: args.kind,
    ref_id: args.id,
    url: args.url,
  });
}
