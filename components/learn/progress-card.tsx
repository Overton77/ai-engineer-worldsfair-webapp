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

type ProgressCardProps = {
  progress: ProgressCardViewModel;
  className?: string;
};

export function ProgressCard({ progress, className }: ProgressCardProps) {
  const percent = Math.min(100, Math.max(0, progress.percent));

  return (
    <Card
      className={cn(
        "border-border/60 from-primary/5 via-card to-accent/5 bg-linear-to-br",
        className,
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {progress.eyebrow ? (
              <p className="text-muted-foreground text-xs font-medium">
                {progress.eyebrow}
              </p>
            ) : null}
            <CardTitle>{progress.title}</CardTitle>
          </div>
          {progress.accent ? (
            <div className="text-accent shrink-0">{progress.accent}</div>
          ) : null}
        </div>
        {progress.summary ? (
          <p className="text-muted-foreground text-sm">{progress.summary}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          aria-label={progress.progressLabel}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percent}
          className="bg-muted h-2 overflow-hidden rounded-full"
          role="progressbar"
        >
          <div className="bg-primary h-full" style={{ width: `${percent}%` }} />
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>{progress.progressLabel}</span>
          {progress.stats?.map((stat) => (
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
        <CardFooter className="justify-end">
          <Button asChild size="sm">
            <Link href={progress.action.href} aria-label={progress.action.ariaLabel}>
              {progress.action.label}
            </Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
