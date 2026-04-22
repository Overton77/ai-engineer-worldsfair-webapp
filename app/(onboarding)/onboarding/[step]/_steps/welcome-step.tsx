import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  Network,
  Sparkles,
} from "lucide-react";

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
      <Card className="border-border/70 from-primary/5 via-card to-accent/5 overflow-hidden bg-gradient-to-br">
        <CardHeader>
          <div className="border-primary/20 bg-primary/10 text-primary inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            The age of agentic engineering
          </div>
          <CardTitle className="mt-4 text-3xl tracking-tight md:text-4xl">
            Welcome aboard, {greeting}.
          </CardTitle>
          <CardDescription className="text-base">
            The frontier moved from chatbots to{" "}
            <span className="text-foreground font-medium">
              fleets of cooperating, sandboxed agents
            </span>
            . Whether you&apos;re a student or already shipping in production,
            AI Engineer is the place to learn it, build it, and stay ahead.
            Four short questions — about ninety seconds — and we&apos;ll
            personalize your home, the recommender, and the assistant.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <figure className="border-border/60 bg-background/60 overflow-hidden rounded-xl border shadow-sm">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src="/onboarding/agentic-engineering-roadmap.png"
                alt="The road to agentic engineering: a five-stop evolution from next-token prediction, to chatbots and copilots, to tool-using agents, to sandboxed production agents, to inter-communicating agent fleets."
                fill
                priority
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="text-muted-foreground border-border/60 border-t px-4 py-2.5 text-xs">
              Where you&apos;re headed, in five stops — from a single token to
              a coordinated fleet.
            </figcaption>
          </figure>

          <div className="grid gap-3 sm:grid-cols-3">
            <Bullet
              icon={<GraduationCap className="size-4" />}
              title="Learn by shipping"
            >
              Courses, mini-quizzes, and graded sandbox challenges that mirror
              real production work.
            </Bullet>
            <Bullet
              icon={<Network className="size-4" />}
              title="Tuned to the frontier"
            >
              A live corpus of papers, talks, libraries and products — ranked
              for the agentic era.
            </Bullet>
            <Bullet
              icon={<Compass className="size-4" />}
              title="Yours, by design"
            >
              Your interests and altitude shape every carousel, every
              cmd-K result, and the assistant.
            </Bullet>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground hidden items-center gap-2 text-xs sm:flex">
          <BookOpen className="size-3.5" />
          Ninety seconds. Skip anything you&apos;re not sure about.
        </p>
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
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border/60 bg-background/60 flex flex-col gap-2 rounded-lg border p-3 text-sm">
      <span className="bg-primary/10 text-primary inline-flex size-7 items-center justify-center rounded-md">
        {icon}
      </span>
      <div>
        <p className="text-foreground font-medium">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
}
