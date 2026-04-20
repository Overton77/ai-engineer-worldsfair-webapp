"use client";

import { Search } from "lucide-react";

import { useCommandPalette } from "@/components/command-palette/command-palette-context";
import { Button } from "@/components/ui/button";

/**
 * Top-bar trigger that opens the global ⌘K command palette. The
 * keyboard shortcut is also bound globally inside
 * <CommandPaletteProvider>, but the visible button keeps the chrome
 * discoverable for mouse users.
 */
export function CommandTrigger() {
  const { setOpen } = useCommandPalette();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-muted-foreground hidden h-9 w-72 justify-between gap-2 px-3 sm:inline-flex"
      onClick={() => setOpen(true)}
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
