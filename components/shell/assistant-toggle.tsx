"use client";

import { Bot } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Right-rail assistant placeholder. The streaming chat + RAG UI lands
 * with U6.x; for now this just keeps the slot warm and signals where
 * the affordance lives.
 */
export function AssistantToggle() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() =>
        toast.message("AI Assistant", {
          description: "Streaming + grounded answers ship in M4.",
        })
      }
    >
      <Bot className="size-4" />
      <span className="hidden sm:inline">Assistant</span>
      <kbd className="bg-muted text-muted-foreground hidden rounded border px-1 py-0.5 font-mono text-[10px] sm:inline">
        ⌘.
      </kbd>
    </Button>
  );
}
