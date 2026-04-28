import { ArrowRight, Compass, Flame, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/require-user";
import { getShellProfile } from "@/lib/db/profile";
import { listRecommendationsForUser } from "@/lib/db/recommendations";
import { getCurrentUserStats } from "@/lib/db/stats";

import Link from "next/link";

export default async function AppHome() {
  const user = await requireUser();
  const [shell, stats, recommendations] = await Promise.all([
    getShellProfile(user.id),
    getCurrentUserStats(user.id),
    listRecommendationsForUser(user.id, 8),
  ]);
  const greeting = shell.displayName ?? shell.email.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-sm">Welcome back,</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting}.
        </h1>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          <span className="border-border/60 bg-card inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5">
            <Sparkles className="text-primary size-3.5" /> XP{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {stats.xpTotal.toLocaleString()}
            </span>
          </span>
          <span className="border-border/60 bg-card inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5">
            <Flame className="text-accent size-3.5" />
            {stats.streakDays === 1
              ? "1-day streak"
              : `${stats.streakDays}-day streak`}
          </span>
        </div>
      </header>

      <Card className="border-border/60 from-primary/5 via-card to-accent/5 bg-linear-to-br">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="text-primary size-4" />
            Start exploring the ecosystem
          </CardTitle>
          <CardDescription>
            Your personalized home will fill up as you save, follow, and
            complete modules. Begin with the directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm">
            <Link href="/explore">
              Open Explore <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Continue learning</h2>
          <span className="text-muted-foreground text-xs">
            Lights up after your first module.
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-border/60">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="mt-3 h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Recommended for you</h2>
          <span className="text-muted-foreground text-xs">
            {recommendations.length > 0
              ? "Based on your saves and follows."
              : "Personalises after a few saves and follows."}
          </span>
        </div>
        {recommendations.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-4">
            {recommendations.map((recommendation) => (
              <Link
                key={`${recommendation.entity_kind}:${recommendation.entity_id}`}
                href={recommendation.href}
                className="group block"
              >
                <Card className="border-border/60 h-full overflow-hidden transition-colors group-hover:border-primary/40">
                  {recommendation.image_url ? (
                    <div
                      className="aspect-video w-full bg-cover bg-center"
                      aria-hidden="true"
                      style={{
                        backgroundImage: `url(${recommendation.image_url})`,
                      }}
                    />
                  ) : (
                    <div className="from-primary/10 via-card to-accent/10 flex aspect-video items-center justify-center bg-linear-to-br">
                      <Badge variant="secondary">
                        {formatEntityKind(recommendation.entity_kind)}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">
                        {formatEntityKind(recommendation.entity_kind)}
                      </Badge>
                      <span className="text-muted-foreground text-[11px]">
                        #{recommendation.rank}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-sm">
                      {recommendation.title}
                    </CardTitle>
                    {recommendation.subtitle ? (
                      <CardDescription className="line-clamp-2 text-xs">
                        {recommendation.subtitle}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs">
                      {formatReason(recommendation.reason_codes)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="border-border/60">
                <CardHeader>
                  <Skeleton className="aspect-video w-full rounded-md" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatEntityKind(kind: string): string {
  return kind.replaceAll("_", " ");
}

function formatReason(reasonCodes: string[]): string {
  if (reasonCodes.includes("similar_users")) return "Because similar users engaged";
  if (reasonCodes.includes("matches_profile")) return "Matches your profile";
  if (reasonCodes.includes("same_domain_layer")) return "In your preferred layer";
  if (reasonCodes.includes("popular_recently")) return "Popular recently";
  if (reasonCodes.includes("fresh")) return "Fresh in the ecosystem";
  return "Recommended for you";
}
