import { BookOpen, Boxes, Flame, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LearningEmptyState } from "@/components/learn/learning-empty-state";
import { ProgressCard } from "@/components/learn/progress-card";
import { RecommendedCoursesSection } from "@/components/learn/recommended-courses-section";
import { RecommendedModulesSection } from "@/components/learn/recommended-modules-section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CurrentUserStats } from "@/lib/db/stats";
import type { LearnerHubData } from "@/lib/db/learn";

import { hubCourseToProgressViewModel } from "./view-models";

type LearnDashboardProps = {
  greeting: string;
  stats: CurrentUserStats;
  hub: LearnerHubData;
};

export function LearnDashboard({ greeting, stats, hub }: LearnDashboardProps) {
  const activeCourse = hub.activeCourses[0] ?? null;
  const recentModule = hub.recentStandaloneModules[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="text-muted-foreground text-sm">Learn</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Good to see you, {greeting}.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Pick up an active course or browse focused standalone modules.
        </p>
      </header>

      {activeCourse ? (
        <ProgressCard progress={hubCourseToProgressViewModel(activeCourse)} />
      ) : (
        <LearningEmptyState />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-primary size-4" />
              Your learning stats
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <StatPill label="XP" value={stats.xpTotal.toLocaleString()} />
            <StatPill
              icon={<Flame className="text-accent size-3.5" />}
              label="Streak"
              value={
                stats.streakDays === 1
                  ? "1 day"
                  : `${stats.streakDays.toLocaleString()} days`
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="text-primary size-4" />
              Recent module
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentModule ? (
              <div className="space-y-1">
                <p className="font-medium">{recentModule.module.title}</p>
                <p className="text-muted-foreground text-sm">
                  Completed standalone. This does not automatically count for
                  course credit.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Complete a standalone module to see it here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <RecommendedCoursesSection courses={hub.recommendedCourses} />
      <RecommendedModulesSection modules={hub.recommendedModules} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Browse</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/courses">
              <BookOpen className="size-3.5" />
              Courses
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/modules">
              <Boxes className="size-3.5" />
              Modules
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/challenges">
              <Trophy className="size-3.5" />
              Challenge previews
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/40 rounded-lg border px-3 py-2">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {icon}
        {label}
      </div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
