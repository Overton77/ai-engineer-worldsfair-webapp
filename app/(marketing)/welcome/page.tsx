import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  Notebook,
  Sparkles,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MarketingHome() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="from-primary/15 via-accent/10 to-background absolute inset-0 -z-10 bg-gradient-to-br"
        />
        <div
          aria-hidden
          className="bg-primary/20 absolute -top-40 -right-32 -z-10 size-96 rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="bg-accent/15 absolute -bottom-40 -left-32 -z-10 size-96 rounded-full blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="border-border/70 bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="text-primary size-3.5" />
            <span>An open learning platform for AI engineers</span>
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Build like an{" "}
            <span className="from-primary to-accent bg-gradient-to-br bg-clip-text text-transparent">
              AI engineer.
            </span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-2xl text-lg text-balance">
            Explore the people, libraries, talks, papers, and products
            shaping AI engineering. Take notes that link to everything.
            Learn through courses with hands-on challenges in a real
            sandbox.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="#explore">Tour the platform</a>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="explore"
        className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3"
      >
        <FeatureCard
          icon={<Compass className="text-primary size-5" />}
          title="Explore the ecosystem"
          body="Search across people, organizations, libraries, papers, talks, videos, and events with a single command palette."
          tag="Discovery"
        />
        <FeatureCard
          icon={<Notebook className="text-primary size-5" />}
          title="Capture what matters"
          body="Save, follow, and take rich notes that link back to the entities they reference. Your second brain, organized by the corpus."
          tag="Knowledge"
        />
        <FeatureCard
          icon={<GraduationCap className="text-primary size-5" />}
          title="Learn by shipping"
          body="Follow guided courses, complete modules with mini-quizzes, and finish with hands-on challenges that grade your code."
          tag="Curriculum"
        />
      </section>

      <section className="border-border/60 bg-card/40 border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              A grounded assistant, with citations.
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              Every answer points back to a chunk of the corpus — a
              talk timestamp, a paper section, a library doc — so you
              can verify, save, or note anything the assistant
              suggests.
            </p>
            <ul className="text-muted-foreground mt-6 grid gap-3 text-sm">
              <FeatureBullet icon={<BookOpen className="size-4" />}>
                Hybrid retrieval (FTS + vectors) over a curated corpus.
              </FeatureBullet>
              <FeatureBullet icon={<Trophy className="size-4" />}>
                XP, streaks, and a leaderboard make progress visible.
              </FeatureBullet>
              <FeatureBullet icon={<Sparkles className="size-4" />}>
                AI tools that can save, follow, and enroll on your behalf — with audit.
              </FeatureBullet>
            </ul>
          </div>
          <Card className="border-border/60 from-primary/5 via-card to-accent/5 bg-gradient-to-br">
            <CardHeader>
              <CardTitle>Five layers, one stack</CardTitle>
              <CardDescription>
                Pick your altitude — from foundation models all the way up to governance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { code: "L1", label: "Intelligence" },
                { code: "L2", label: "Agents" },
                { code: "L3", label: "Systems" },
                { code: "L4", label: "Application" },
                { code: "L5", label: "Governance" },
              ].map((layer) => (
                <div
                  key={layer.code}
                  className="border-border/70 bg-background/70 rounded-lg border px-2 py-3"
                >
                  <div className="text-primary font-mono text-sm font-semibold">
                    {layer.code}
                  </div>
                  <div className="text-muted-foreground mt-1 leading-tight">
                    {layer.label}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Ready to start exploring?
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-balance">
          One magic-link sign-in. Onboarding takes about ninety seconds.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/login">
            Sign in to begin
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <Card className="border-border/60 hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="bg-primary/10 inline-flex size-9 items-center justify-center rounded-lg">
            {icon}
          </div>
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            {tag}
          </span>
        </div>
        <CardTitle className="mt-3 text-lg">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function FeatureBullet({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-primary/10 text-primary mt-0.5 inline-flex size-6 items-center justify-center rounded-md">
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}
