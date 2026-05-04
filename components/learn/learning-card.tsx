import Image from "next/image";
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

import { ExpandableSummary } from "./expandable-summary";
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
  const objectPosition =
    item.image?.focalX !== null &&
    item.image?.focalX !== undefined &&
    item.image?.focalY !== null &&
    item.image?.focalY !== undefined
      ? `${item.image.focalX * 100}% ${item.image.focalY * 100}%`
      : undefined;

  return (
    <Card className={cn("border-border/60 h-full overflow-hidden", className)}>
      {item.image ? (
        <div
          className="bg-muted relative aspect-video overflow-hidden border-b"
          style={{ backgroundColor: item.image.dominantColor ?? undefined }}
        >
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="(min-width: 1024px) 24rem, 100vw"
            className="object-cover"
            style={{ objectPosition }}
          />
        </div>
      ) : null}
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            {item.categoryLabel ? (
              <p className="text-primary text-sm font-semibold leading-snug tracking-tight">
                {item.categoryLabel}
              </p>
            ) : null}
            {item.eyebrow ? (
              <p
                className={cn(
                  "text-muted-foreground leading-snug",
                  item.categoryLabel ? "text-[11px]" : "text-xs font-medium",
                )}
              >
                {item.eyebrow}
              </p>
            ) : null}
          </div>
          {item.badges && item.badges.length > 0 ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              {item.badges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant={badge.variant ?? "outline"}
                  className="text-[10px] font-medium"
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-balance leading-tight">{item.title}</CardTitle>
          {item.expandableSummary ? (
            <ExpandableSummary text={item.summary} />
          ) : (
            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
              {item.summary}
            </p>
          )}
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
