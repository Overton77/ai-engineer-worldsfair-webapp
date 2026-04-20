"use client";

import { useTransition } from "react";
import { ArrowRight, PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  DOMAIN_LAYER_META,
  GOAL_LABELS,
  type CategoryKey,
  type DomainLayer,
  type GoalKey,
} from "@/lib/schema/taxonomy";

import { finishOnboardingAction } from "../../actions";
import type { ProfileRow } from "@/lib/db/profile";

export function DoneStep({ profile }: { profile: ProfileRow }) {
  const [pending, start] = useTransition();
  const layer = profile.home_layer
    ? DOMAIN_LAYER_META[profile.home_layer as DomainLayer]
    : null;

  return (
    <Card className="border-border/70 from-primary/5 via-card to-accent/5 bg-gradient-to-br">
      <CardHeader>
        <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
          <PartyPopper className="size-5" />
        </div>
        <CardTitle className="mt-3 text-2xl">You&apos;re set up.</CardTitle>
        <CardDescription className="text-base">
          Your home will now personalise around what you picked. You can
          tweak everything from settings any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {layer ? (
          <Recap title="Home layer">
            <span className="font-mono text-xs">{layer.code}</span>{" "}
            <span className="text-foreground">{layer.label}</span>
          </Recap>
        ) : null}
        {profile.interest_tags.length > 0 ? (
          <Recap title="Interests">
            <div className="flex flex-wrap gap-1.5">
              {profile.interest_tags.map((tag) => (
                <Pill key={tag}>
                  {CATEGORY_LABELS[tag as CategoryKey] ?? tag}
                </Pill>
              ))}
            </div>
          </Recap>
        ) : null}
        {profile.goals.length > 0 ? (
          <Recap title="Goals">
            <div className="flex flex-wrap gap-1.5">
              {profile.goals.map((g) => (
                <Pill key={g}>{GOAL_LABELS[g as GoalKey] ?? g}</Pill>
              ))}
            </div>
          </Recap>
        ) : null}
      </CardContent>
      <CardContent className="flex justify-end border-t pt-5">
        <Button
          type="button"
          size="lg"
          onClick={() => start(() => finishOnboardingAction())}
          disabled={pending}
        >
          {pending ? "Loading…" : "Start exploring"}
          {!pending ? <ArrowRight className="size-4" /> : null}
        </Button>
      </CardContent>
    </Card>
  );
}

function Recap({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/60 bg-background/60 rounded-lg border p-3">
      <div className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">
        {title}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-border bg-background text-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs">
      {children}
    </span>
  );
}
