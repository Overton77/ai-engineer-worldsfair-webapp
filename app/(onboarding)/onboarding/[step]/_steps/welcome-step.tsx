import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { hrefForStep } from "../../steps";

export function WelcomeStep({
  displayName,
}: {
  displayName: string | null;
}) {
  const greeting = displayName ?? "engineer";
  return (
    <div className="space-y-6">
      <Card className="border-border/70 from-primary/5 via-card to-accent/5 bg-gradient-to-br">
        <CardHeader>
          <div className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full">
            <Sparkles className="size-5" />
          </div>
          <CardTitle className="mt-3 text-2xl">
            Welcome aboard, {greeting}.
          </CardTitle>
          <CardDescription className="text-base">
            Let&apos;s set up your space. Four short questions — about
            ninety seconds — and we&apos;ll personalize your home, the
            recommender, and the assistant from there.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Bullet icon={<Compass className="size-4" />}>
            Your interests shape every carousel and the cmd-K results.
          </Bullet>
          <Bullet icon={<BookOpen className="size-4" />}>
            Your home layer picks the altitude — foundations through
            governance.
          </Bullet>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button asChild size="lg">
          <Link href={hrefForStep("identity")}>
            Let&apos;s start <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Bullet({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/60 bg-background/60 flex items-start gap-3 rounded-lg border p-3 text-sm">
      <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-7 items-center justify-center rounded-md">
        {icon}
      </span>
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}
