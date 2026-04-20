"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type DossierTab = {
  id: string;
  label: string;
  count?: number;
};

type DossierTabsProps = {
  tabs: readonly DossierTab[];
  active: string;
  onChange?: (next: string) => void;
  className?: string;
};

/**
 * Lightweight tab strip used by every dossier. Lives inline (no
 * portals) and is fully controlled — pages either hold tab state in
 * URL params or local component state.
 */
export function DossierTabs({
  tabs,
  active,
  onChange,
  className,
}: DossierTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "border-border/60 bg-background/50 flex flex-wrap items-center gap-1 rounded-lg border p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span className="text-muted-foreground ml-1.5 text-xs">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
