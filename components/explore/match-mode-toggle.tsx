"use client";

import { Sparkles, Type, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Internal mode keys are kept stable so URL state doesn't churn; the
 * UI labels the user sees are intentionally non-technical.
 */
export type MatchMode = "lexical" | "semantic" | "hybrid";

type MatchModeToggleProps = {
  value: MatchMode;
  onChange: (next: MatchMode) => void;
  /** Modes that are wired up; others render disabled with a tooltip. */
  available: MatchMode[];
  className?: string;
};

const MODE_META: Record<
  MatchMode,
  { label: string; help: string; icon: typeof Type }
> = {
  lexical: {
    label: "By name",
    help: "Match titles, names, and tags exactly.",
    icon: Type,
  },
  semantic: {
    label: "By meaning",
    help: "Match the idea, not just the words.",
    icon: Sparkles,
  },
  hybrid: {
    label: "Smart",
    help: "Best of both — recommended.",
    icon: Zap,
  },
};

const MODE_ORDER: MatchMode[] = ["lexical", "semantic", "hybrid"];

export function MatchModeToggle({
  value,
  onChange,
  available,
  className,
}: MatchModeToggleProps) {
  return (
    <TooltipProvider>
      <div
        role="radiogroup"
        aria-label="Search mode"
        className={cn(
          "border-border/60 bg-background flex items-center gap-0.5 rounded-lg border p-0.5",
          className,
        )}
      >
        {MODE_ORDER.map((mode) => {
          const meta = MODE_META[mode];
          const isAvailable = available.includes(mode);
          const isActive = value === mode;
          const Icon = meta.icon;

          const button = (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={isActive ? "secondary" : "ghost"}
              role="radio"
              aria-checked={isActive}
              disabled={!isAvailable}
              onClick={() => isAvailable && onChange(mode)}
              className={cn(
                "h-7 gap-1 px-2 text-xs",
                !isAvailable && "opacity-50",
              )}
            >
              <Icon className="size-3" />
              {meta.label}
            </Button>
          );

          if (isAvailable) {
            return (
              <Tooltip key={mode}>
                <TooltipTrigger render={button} />
                <TooltipContent>{meta.help}</TooltipContent>
              </Tooltip>
            );
          }
          return (
            <Tooltip key={mode}>
              <TooltipTrigger render={button} />
              <TooltipContent>
                {meta.help} <span className="opacity-70">(coming soon)</span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
