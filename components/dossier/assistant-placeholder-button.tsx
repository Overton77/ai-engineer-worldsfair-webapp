"use client";

import { Bot } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Stand-in for the M4 Assistant drawer trigger. Lives on the dossier
 * hero so users see the affordance early; clicking it explains what's
 * coming. Replace with the real drawer wiring once U6.2 ships.
 */
export function AssistantPlaceholderButton({ title }: { title: string }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() =>
        toast.message("Assistant coming soon", {
          description: `Ask-the-assistant ships in M4. (${title})`,
        })
      }
    >
      <Bot className="size-3.5" />
      Ask
    </Button>
  );
}
