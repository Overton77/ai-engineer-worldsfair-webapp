import Link from "next/link";

import { getOptionalUser } from "@/lib/auth/require-user";
import { listRecent, listUnreadCount } from "@/lib/db/notifications";

import { NotificationsBellClient } from "./notifications-bell.client";

/**
 * Server component: fetches the unread count + a small page of recent
 * notifications for the dropdown. The client child handles open/close
 * state, mark-read calls, and the visual badge.
 */
export async function NotificationsBell() {
  const user = await getOptionalUser();
  if (!user) {
    return (
      <Link
        href="/login"
        aria-label="Sign in for notifications"
        className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md"
      />
    );
  }

  const [unread, recent] = await Promise.all([
    listUnreadCount(user.id),
    listRecent(user.id, 12),
  ]);

  return (
    <NotificationsBellClient
      unreadCount={unread}
      items={recent.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        url: n.url,
        readAt: n.read_at,
        createdAt: n.created_at,
      }))}
    />
  );
}
