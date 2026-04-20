"use client";

import Link from "next/link";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { markNotificationRead } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  readAt: string | null;
  createdAt: string;
};

type Props = {
  unreadCount: number;
  items: NotificationItem[];
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function NotificationsBellClient({ unreadCount, items }: Props) {
  const [optimisticUnread, setOptimisticUnread] = React.useState(unreadCount);
  const [optimisticItems, setOptimisticItems] = React.useState(items);
  // Keep optimistic state in sync with fresh server data on revalidation.
  React.useEffect(() => {
    setOptimisticUnread(unreadCount);
    setOptimisticItems(items);
  }, [unreadCount, items]);

  const onItemClick = async (id: string) => {
    setOptimisticItems((prev) =>
      prev.map((p) =>
        p.id === id && p.readAt === null
          ? { ...p, readAt: new Date().toISOString() }
          : p,
      ),
    );
    setOptimisticUnread((c) => Math.max(0, c - 1));
    await markNotificationRead({ target: id }).catch(() => {
      toast.error("Failed to mark notification read");
    });
  };

  const onMarkAll = async () => {
    setOptimisticItems((prev) =>
      prev.map((p) => ({
        ...p,
        readAt: p.readAt ?? new Date().toISOString(),
      })),
    );
    setOptimisticUnread(0);
    const result = await markNotificationRead({ target: "all" }).catch(() => null);
    if (!result) toast.error("Failed to mark all as read");
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={
              optimisticUnread > 0
                ? `Notifications (${optimisticUnread} unread)`
                : "Notifications"
            }
            className="relative"
          >
            <Bell className="size-4" />
            {optimisticUnread > 0 ? (
              <span
                aria-hidden
                className="bg-primary text-primary-foreground absolute top-0 right-0 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none"
              >
                {optimisticUnread > 99 ? "99+" : optimisticUnread}
              </span>
            ) : null}
          </Button>
        }
      />
      <PopoverContent
        className="w-[360px] p-0"
        align="end"
        sideOffset={6}
      >
        <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {optimisticUnread > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onMarkAll}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          ) : null}
        </header>

        {optimisticItems.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-3 py-8 text-center text-xs">
            <Inbox className="size-5" />
            <span>You&rsquo;re all caught up.</span>
          </div>
        ) : (
          <ul className="max-h-[420px] overflow-y-auto py-1">
            {optimisticItems.map((n) => {
              const inner = (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        n.readAt ? "text-muted-foreground" : "font-medium",
                      )}
                    >
                      {n.title}
                    </p>
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  {n.body ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {n.body}
                    </p>
                  ) : null}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.url ? (
                    <Link
                      href={n.url}
                      onClick={() => onItemClick(n.id)}
                      className={cn(
                        "hover:bg-muted block px-3 py-2 transition-colors",
                        !n.readAt && "bg-muted/50",
                      )}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onItemClick(n.id)}
                      className={cn(
                        "hover:bg-muted block w-full px-3 py-2 text-left transition-colors",
                        !n.readAt && "bg-muted/50",
                      )}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
