import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LearnerCardViewModel } from "./types";

type LearningCardProps = {
  item: LearnerCardViewModel;
  className?: string;
  actionVariant?: "default" | "outline" | "secondary" | "ghost";
};

export function LearningCard({
  item,
  className,
  actionVariant = "default",
}: LearningCardProps) {
  return (
    <Card className={cn("border-border/60 h-full", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.eyebrow ? (
            <span className="text-muted-foreground text-xs font-medium">
              {item.eyebrow}
            </span>
          ) : null}
          {item.badges?.map((badge) => (
            <Badge
              key={badge.label}
              variant={badge.variant ?? "outline"}
              className="text-[10px]"
            >
              {badge.label}
            </Badge>
          ))}
        </div>
        <div className="space-y-1.5">
          <CardTitle>{item.title}</CardTitle>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {item.summary}
          </p>
        </div>
      </CardHeader>
      {item.stats && item.stats.length > 0 ? (
        <CardContent>
          <dl className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {item.stats.map((stat) => (
              <div key={`${stat.label}:${stat.value ?? ""}`} className="flex gap-1">
                {stat.value ? (
                  <>
                    <dt>{stat.label}</dt>
                    <dd className="text-foreground font-mono font-medium tabular-nums">
                      {stat.value}
                    </dd>
                  </>
                ) : (
                  <dt>{stat.label}</dt>
                )}
              </div>
            ))}
          </dl>
        </CardContent>
      ) : null}
      <CardFooter className="justify-end">
        <Button asChild size="sm" variant={actionVariant}>
          <Link href={item.action.href} aria-label={item.action.ariaLabel}>
            {item.action.label}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
