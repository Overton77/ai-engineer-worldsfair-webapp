"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { OverviewInlineLinks } from "@/lib/text/overview-inline-links";
import { cn } from "@/lib/utils";

export function ExpandableOverview({
  id,
  text,
  href,
  openLabel = "Open item",
  className,
}: {
  id: string;
  text?: string | null;
  href: string;
  openLabel?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const overview = text?.trim();

  if (!overview) {
    return (
      <p className="border-border/60 bg-muted/30 text-muted-foreground mt-3 rounded-lg border border-dashed px-3 py-2 text-sm italic">
        No overview available yet.
      </p>
    );
  }

  return (
    <div className={cn("mt-3 flex flex-col gap-2", className)}>
      <p id={id} className="text-muted-foreground text-sm">
        {/* Inner wrapper: line-clamp on <p> can hide nested <a> in WebKit-style ellipsis. */}
        <span
          className={cn(
            expanded ? "leading-relaxed" : "line-clamp-4",
            "[&_a]:underline [&_a]:decoration-primary/45",
          )}
        >
          <OverviewInlineLinks text={overview} />
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto px-0"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Show full overview"}
        </Button>
        {expanded ? (
          <Link
            href={href}
            className="text-primary hover:text-primary/80 focus-visible:ring-ring/50 rounded text-xs font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:outline-none"
          >
            {openLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
