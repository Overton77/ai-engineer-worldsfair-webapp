import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Cpu,
  GraduationCap,
  Layers3,
  Library,
  Notebook,
  Sparkles,
  Trophy,
} from "lucide-react";

import { CourseCard } from "@/components/courses/course-card";
import { courseToCardViewModel } from "@/components/learn/view-models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listPeople, listLibraries, listPapers } from "@/lib/db/entities";
import { listPublishedCourseCatalog, type CourseCatalogItem } from "@/lib/db/learn";
import type { EntitySummary } from "@/types/domain";

export default async function MarketingHome() {
  const { courses, entities } = await getWelcomeData();

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="from-primary/15 via-accent/10 to-background absolute inset-0 -z-10 bg-linear-to-br"
        />
        <div
          aria-hidden
          className="bg-primary/20 absolute -top-40 -right-32 -z-10 size-96 rounded-full blur-3xl"
        />
        <div
          aria-hidden
          className="bg-accent/15 absolute -bottom-40 -left-32 -z-10 size-96 rounded-full blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-24 pb-20 md:pt-32 md:pb-28 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-center">
          <div>
            <div className="border-border/70 bg-background/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="text-primary size-3.5" />
              <span>A learning map for modern AI engineering</span>
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Grow from prompts to{" "}
              <span className="from-primary to-accent bg-linear-to-br bg-clip-text text-transparent">
                production agents.
              </span>
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-lg text-balance">
              Explore the people, libraries, papers, talks, and courses shaping
              AI engineering. Follow structured paths, save what matters, and
              build toward real agentic systems.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Start learning
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href="#courses">Explore the path</a>
              </Button>
            </div>
          </div>
          <Card className="border-border/60 bg-card/70 overflow-hidden shadow-2xl">
            <div className="relative aspect-4/3">
              <Image
                src="/tokens-to-agents-hero.png"
                alt="Illustration of AI engineering evolving from token prediction into agentic systems"
                fill
                priority
                sizes="(min-width: 1024px) 30rem, 100vw"
                className="object-cover"
              />
            </div>
          </Card>
        </div>
      </section>

      <section
        id="courses"
        className="mx-auto max-w-6xl space-y-6 px-6 pb-20"
      >
        <SectionHeading
          eyebrow="Featured courses"
          title="Start with a guided path"
          body="Published course paths turn the AI engineering landscape into a sequence you can actually follow."
          action={
            <Button asChild variant="ghost">
              <Link href="/courses">Browse all courses</Link>
            </Button>
          }
        />
        {courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {courses.map((item) => (
              <CourseCard
                key={item.course.course_id}
                course={courseToCardViewModel(item)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-border/60">
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Published courses will appear here as the catalog grows.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="border-border/60 bg-card/40 border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="From prediction to agency"
              title="See the whole evolution"
              body="AI engineering is no longer just model prompting. It now spans context, tools, memory, evaluation, workflows, and product judgment."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<Cpu className="text-primary size-5" />}
                title="Understand the foundations"
                body="Build intuition for models, context windows, embeddings, and the limits that shape product behavior."
                tag="Models"
              />
              <FeatureCard
                icon={<Layers3 className="text-primary size-5" />}
                title="Connect the system"
                body="Learn how tools, memory, retrieval, evaluation, and human workflows fit around the model."
                tag="Systems"
              />
            </div>
          </div>
          <Card className="border-border/60 bg-background/70 overflow-hidden">
            <div className="relative aspect-4/3">
              <Image
                src="/ai-engineering-knowledge-map.png"
                alt="Illustration of AI engineering courses, papers, libraries, people, and challenges connected as a learning map"
                fill
                sizes="(min-width: 1024px) 28rem, 100vw"
                className="object-cover"
              />
            </div>
          </Card>
        </div>
      </section>

      <section
        id="explore"
        className="mx-auto max-w-6xl space-y-6 px-6 py-20"
      >
        <SectionHeading
          eyebrow="Live ecosystem"
          title="Explore real AI engineering references"
          body="The welcome page can surface actual entries from the app so visitors see the corpus, not a placeholder pitch."
          action={
            <Button asChild variant="ghost">
              <Link href="/explore">Open explore</Link>
            </Button>
          }
        />
        {entities.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {entities.map((entity) => (
              <EntityPreviewCard key={`${entity.kind}:${entity.id}`} entity={entity} />
            ))}
          </div>
        ) : (
          <Card className="border-border/60">
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Featured people, libraries, and papers will appear here when the
                public corpus is available.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        <FeatureCard
          icon={<Compass className="text-primary size-5" />}
          title="Discover the field"
          body="Move through the people, organizations, libraries, papers, talks, products, and events defining AI engineering."
          tag="Discovery"
        />
        <FeatureCard
          icon={<Notebook className="text-primary size-5" />}
          title="Keep useful context"
          body="Save references, follow topics, and take notes that stay connected to the source material you care about."
          tag="Knowledge"
        />
        <FeatureCard
          icon={<GraduationCap className="text-primary size-5" />}
          title="Practice with purpose"
          body="Follow courses, complete modules, and build toward hands-on challenges that turn concepts into skill."
          tag="Curriculum"
        />
      </section>

      <section className="border-border/60 bg-card/40 border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              A learning companion for the agent era.
            </h2>
            <p className="text-muted-foreground mt-3 text-balance">
              The best AI engineers learn across research, tools, product
              examples, and implementation practice. The app brings those
              threads together so each session can move you forward.
            </p>
            <ul className="text-muted-foreground mt-6 grid gap-3 text-sm">
              <FeatureBullet icon={<BookOpen className="size-4" />}>
                Trace ideas back to papers, talks, libraries, and product examples.
              </FeatureBullet>
              <FeatureBullet icon={<Trophy className="size-4" />}>
                Track momentum with course progress, XP, and learning history.
              </FeatureBullet>
              <FeatureBullet icon={<Sparkles className="size-4" />}>
                Turn scattered discoveries into a personal path through the field.
              </FeatureBullet>
            </ul>
          </div>
          <Card className="border-border/60 from-primary/5 via-card to-accent/5 bg-linear-to-br">
            <CardHeader>
              <CardTitle>Your path from models to agents</CardTitle>
              <CardDescription>
                Learn the layers that turn raw model capability into useful AI products.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { code: "01", label: "Models" },
                { code: "02", label: "Context" },
                { code: "03", label: "Tools" },
                { code: "04", label: "Agents" },
                { code: "05", label: "Products" },
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
          Start with a course, follow the ideas that catch your attention, and
          build your way toward production-grade agents.
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

async function getWelcomeData(): Promise<{
  courses: CourseCatalogItem[];
  entities: EntitySummary[];
}> {
  const [coursesResult, peopleResult, librariesResult, papersResult] =
    await Promise.allSettled([
      listPublishedCourseCatalog({ limit: 3 }),
      listPeople({ limit: 2 }),
      listLibraries({ limit: 2 }),
      listPapers({ limit: 2 }),
    ]);

  return {
    courses: settledValue(coursesResult).slice(0, 3),
    entities: [
      ...settledValue(peopleResult),
      ...settledValue(librariesResult),
      ...settledValue(papersResult),
    ].slice(0, 6),
  };
}

function settledValue<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === "fulfilled" ? result.value : [];
}

function SectionHeading({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
        <p className="text-muted-foreground mt-3 text-balance">{body}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  tag,
}: {
  icon: ReactNode;
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
  icon: ReactNode;
  children: ReactNode;
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

function EntityPreviewCard({ entity }: { entity: EntitySummary }) {
  const description =
    entity.description ?? entity.subtitle ?? "A reference from the AI engineering map.";

  return (
    <Card className="border-border/60 hover:border-primary/40 h-full transition-colors">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="bg-primary/10 text-primary inline-flex size-9 items-center justify-center rounded-lg">
            <Library className="size-5" />
          </div>
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            {formatKind(entity.kind)}
          </span>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="line-clamp-2 text-lg">{entity.title}</CardTitle>
          {entity.subtitle ? (
            <CardDescription className="line-clamp-1">
              {entity.subtitle}
            </CardDescription>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-4">
        <p className="text-muted-foreground line-clamp-3 text-sm">{description}</p>
        <Button asChild size="sm" variant="outline" className="self-start">
          <Link href={entity.href}>View reference</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatKind(kind: EntitySummary["kind"]): string {
  return kind
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
