import { Flame, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type XpStreakBadgeProps = {
  xpTotal: number;
  streakDays: number;
  className?: string;
};

export function XpStreakBadge({
  xpTotal,
  streakDays,
  className,
}: XpStreakBadgeProps) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/60 grid gap-2 rounded-lg border p-3 text-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground inline-flex items-center gap-1.5">
          <Sparkles className="text-primary size-3.5" /> XP
        </span>
        <span className="text-foreground font-mono font-semibold tabular-nums">
          {xpTotal.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground inline-flex items-center gap-1.5">
          <Flame className="text-accent size-3.5" /> Streak
        </span>
        <span className="text-foreground font-mono font-semibold tabular-nums">
          {streakDays === 1 ? "1 day" : `${streakDays} days`}
        </span>
      </div>
    </div>
  );
}
