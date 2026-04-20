import { ArrowRight, Compass, Flame, Sparkles } from "lucide-react";

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
import { getCurrentUserStats } from "@/lib/db/stats";

import Link from "next/link";

export default async function AppHome() {
  const user = await requireUser();
  const [shell, stats] = await Promise.all([
    getShellProfile(user.id),
    getCurrentUserStats(user.id),
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

      <Card className="border-border/60 from-primary/5 via-card to-accent/5 bg-gradient-to-br">
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
            Personalises after a few saves and follows.
          </span>
        </div>
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
      </section>
    </div>
  );
}
