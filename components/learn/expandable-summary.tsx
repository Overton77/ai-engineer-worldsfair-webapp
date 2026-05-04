"use client";

import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLAPSED_CHARS = 200;

type ExpandableSummaryProps = {
  text: string;
  className?: string;
};

export function ExpandableSummary({ text, className }: ExpandableSummaryProps) {
  const id = useId();
  const needsToggle = useMemo(() => text.trim().length > COLLAPSED_CHARS, [text]);
  const [open, setOpen] = useState(false);

  if (!needsToggle) {
    return (
      <p className={cn("text-muted-foreground text-sm leading-relaxed", className)}>{text}</p>
    );
  }

  const snippet = open
    ? text
    : (() => {
        const raw = text.slice(0, COLLAPSED_CHARS).trimEnd();
        const lastSpace = raw.lastIndexOf(" ");
        const atWord =
          lastSpace > COLLAPSED_CHARS * 0.55 ? raw.slice(0, lastSpace).trimEnd() : raw;
        return `${atWord}…`;
      })();

  return (
    <div className={cn("space-y-1.5", className)}>
      <p id={id} className="text-muted-foreground text-sm leading-relaxed">
        {snippet}
      </p>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-primary h-auto px-0 py-0 text-xs font-medium underline-offset-4"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Show less" : "Show full overview"}
      </Button>
    </div>
  );
}
