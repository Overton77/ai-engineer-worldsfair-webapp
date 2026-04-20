"use client";

import { Bell } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Bell badge placeholder. The `notification` table + real unread count
 * ship with U0.9 + the rest of M3 Capture; here we keep the affordance.
 */
export function NotificationsBell() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Notifications"
      onClick={() =>
        toast.message("Notifications", {
          description: "Follow-news alerts arrive in M3.",
        })
      }
    >
      <Bell className="size-4" />
    </Button>
  );
}
