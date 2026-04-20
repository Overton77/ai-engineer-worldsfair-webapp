/**
 * Notification DAL — append-only per-user feed surfaced in the header bell.
 *
 * Reads use the SSR Supabase client (RLS scopes to the calling user).
 * Inserts go through the same client when called from a Server Action
 * authored by that user (e.g. `follow → follow_created`); background
 * jobs would use the service-role client and bypass RLS.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? (await createServerSupabase());
}

export type NotificationRow = Database["public"]["Tables"]["notification"]["Row"];

export type NewNotification = {
  user_id: string;
  kind: string;
  title: string;
  ref_kind?: string | null;
  ref_id?: string | null;
  body?: string | null;
  url?: string | null;
};

/**
 * Count of unread notifications for a user. Used by the header bell.
 * Cheap thanks to the partial index `notification_user_unread_idx`.
 */
export async function listUnreadCount(
  userId: string,
  client?: Client,
): Promise<number> {
  const sb = await getClient(client);
  const { count, error } = await sb
    .from("notification")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) {
    console.warn(`notifications.listUnreadCount: ${error.message}`);
    return 0;
  }
  return count ?? 0;
}

/**
 * Recent notifications (read + unread, newest first).
 */
export async function listRecent(
  userId: string,
  limit = 20,
  client?: Client,
): Promise<NotificationRow[]> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("notification")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 100));
  if (error) {
    console.warn(`notifications.listRecent: ${error.message}`);
    return [];
  }
  return data ?? [];
}

/**
 * Append a notification. Caller is responsible for choosing `user_id`
 * (typically the recipient — for follow events that's the follower
 * themselves, since v1 is purely "your followed entity is followed").
 */
export async function insertNotification(
  input: NewNotification,
  client?: Client,
): Promise<NotificationRow | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("notification")
    .insert({
      user_id: input.user_id,
      kind: input.kind,
      title: input.title,
      ref_kind: input.ref_kind ?? null,
      ref_id: input.ref_id ?? null,
      body: input.body ?? null,
      url: input.url ?? null,
    })
    .select("*")
    .single();
  if (error) {
    console.warn(`notifications.insertNotification: ${error.message}`);
    return null;
  }
  return data;
}

/**
 * Mark one or all of a user's notifications as read. RLS keeps each
 * user from touching anyone else's rows.
 */
export async function markRead(
  target: string | "all",
  userId: string,
  client?: Client,
): Promise<{ updated: number }> {
  const sb = await getClient(client);
  const now = new Date().toISOString();
  let q = sb
    .from("notification")
    .update({ read_at: now })
    .eq("user_id", userId)
    .is("read_at", null);
  if (target !== "all") q = q.eq("id", target);
  const { data, error } = await q.select("id");
  if (error) {
    console.warn(`notifications.markRead: ${error.message}`);
    return { updated: 0 };
  }
  return { updated: data?.length ?? 0 };
}
