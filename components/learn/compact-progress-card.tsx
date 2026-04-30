import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { ProgressCardViewModel } from "./types";

type CompactProgressCardProps = {
  progress: ProgressCardViewModel;
  className?: string;
};

export function CompactProgressCard({
  progress,
  className,
}: CompactProgressCardProps) {
  const percent = Math.min(100, Math.max(0, progress.percent));

  return (
    <Card
      className={cn(
        "border-border/60 from-primary/5 via-card to-accent/5 h-full bg-linear-to-br",
        className,
      )}
    >
      <CardHeader className="space-y-2 px-3 py-3">
        {progress.eyebrow ? (
          <p className="text-muted-foreground text-[11px] font-medium">
            {progress.eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <CardTitle className="line-clamp-2 text-sm">{progress.title}</CardTitle>
          {progress.summary ? (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {progress.summary}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3">
        <div
          aria-label={progress.progressLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percent}
          className="bg-muted h-1.5 overflow-hidden rounded-full"
          role="progressbar"
        >
          <div className="bg-primary h-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span>{progress.progressLabel}</span>
          {progress.stats?.slice(0, 1).map((stat) => (
            <span key={`${stat.label}:${stat.value ?? ""}`} className="inline-flex gap-1">
              <span>{stat.label}</span>
              {stat.value ? (
                <span className="text-foreground font-mono font-medium tabular-nums">
                  {stat.value}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </CardContent>
      {progress.action ? (
        <CardFooter className="justify-end px-3 py-3">
          <Button asChild size="xs">
            <Link href={progress.action.href} aria-label={progress.action.ariaLabel}>
              {progress.action.label}
            </Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
