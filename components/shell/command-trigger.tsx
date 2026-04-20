"use client";

import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Cmd-K placeholder. Real palette ships in U3.1; for now we just keep
 * the slot warm so the chrome looks finished and the keyboard hint is
 * already wired.
 */
export function CommandTrigger() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-muted-foreground hidden h-9 w-72 justify-between gap-2 px-3 sm:inline-flex"
      onClick={() =>
        toast.message("Search", {
          description: "Cmd-K palette ships in U3.1.",
        })
      }
    >
      <span className="inline-flex items-center gap-2">
        <Search className="size-4" />
        Search anything…
      </span>
      <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
        ⌘K
      </kbd>
    </Button>
  );
}
