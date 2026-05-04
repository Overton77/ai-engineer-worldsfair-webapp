import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { ChallengePreviewCard } from "@/components/challenges/challenge-preview-card";
import { ProgressCard } from "@/components/learn/progress-card";
import type { ChallengePreviewCardViewModel } from "@/components/learn/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ChallengeRow,
  CourseEnrollmentRow,
  CourseModuleCompletionRow,
  CourseModulePrerequisite,
  CourseProgressCache,
  CourseRow,
  CourseSyllabusItem,
} from "@/lib/db/learn";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database.types";

type CourseDetailProps = {
  course: CourseRow;
  enrollment: CourseEnrollmentRow | null;
  progress: CourseProgressCache;
  syllabus: CourseSyllabusItem[];
  completions: CourseModuleCompletionRow[];
  prerequisites: CourseModulePrerequisite[];
  challenges: ChallengeRow[];
  startAction: (formData: FormData) => void | Promise<void>;
};

export function CourseDetail({
  course,
  enrollment,
  progress,
  syllabus,
  completions,
  prerequisites,
  challenges,
  startAction,
}: CourseDetailProps) {
  const isEnrolled = Boolean(enrollment);
  const completionByModule = new Map(
    completions
      .filter((completion) => completion.course_version === course.version)
      .map((completion) => [completion.module_id, completion]),
  );
  const prerequisiteLabels = groupPrerequisites(prerequisites);
  const durationMinutes = totalDuration(syllabus);
  const nextModule = getNextModule(syllabus, completionByModule);
  const resumeHref = nextModule
    ? `/courses/${course.slug}/m/${nextModule.module.slug}`
    : `/courses/${course.slug}`;
  const outcomes = courseOutcomes(course, syllabus);
  const challengeCards = challenges.map((challenge) =>
    challengeToPreview(course, challenge),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <main className="space-y-6">
          <CourseHero
            course={course}
            isEnrolled={isEnrolled}
            startAction={startAction}
            resumeHref={resumeHref}
          />

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                What you&apos;ll learn
              </h2>
              <p className="text-muted-foreground text-sm">
                Outcomes are drawn from the course modules and kept focused on
                the practical path.
              </p>
            </div>
            <Card className="border-border/60">
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2 text-sm">
                      <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <CourseSyllabus
            course={course}
            syllabus={syllabus}
            completionByModule={completionByModule}
            prerequisiteLabels={prerequisiteLabels}
          />

          <section id="challenge-preview" className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Challenge preview
              </h2>
              <p className="text-muted-foreground text-sm">
                Read-only previews show what the path prepares you for. Running
                challenges is outside this slice.
              </p>
            </div>
            {challengeCards.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {challengeCards.map((challenge) => (
                  <div
                    key={challenge.action.href}
                    id={challenge.action.href.split("#")[1]}
                  >
                    <ChallengePreviewCard challenge={challenge} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-border/60">
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    No published challenge previews are attached to this course
                    yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <EnrollmentCard
            course={course}
            enrollment={enrollment}
            progress={progress}
            moduleCount={syllabus.length}
            durationMinutes={durationMinutes}
            nextModuleTitle={nextModule?.module.title ?? null}
            resumeHref={resumeHref}
            startAction={startAction}
          />
          <CourseFactsCard
            course={course}
            syllabus={syllabus}
            durationMinutes={durationMinutes}
          />
          <PrerequisitesCard prerequisites={prerequisiteLabels} />
        </aside>
      </div>
    </div>
  );
}

function CourseHero({
  course,
  isEnrolled,
  startAction,
  resumeHref,
}: {
  course: CourseRow;
  isEnrolled: boolean;
  startAction: CourseDetailProps["startAction"];
  resumeHref: string;
}) {
  return (
    <section className="border-border/60 from-card via-card to-accent/5 rounded-2xl border bg-linear-to-br p-6">
      <div className="max-w-3xl space-y-5">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            {compactLabel([
              formatDomain(course.domain_layer),
              formatDomain(course.domain_bucket),
              isEnrolled
                ? `Enrolled v${course.version}`
                : `Published v${course.version}`,
            ])}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {course.title}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            {course.summary ?? "A structured path for production AI learning."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {isEnrolled ? (
            <Button asChild>
              <Link href={resumeHref}>Resume course</Link>
            </Button>
          ) : (
            <form action={startAction}>
              <input name="courseId" type="hidden" value={course.course_id} />
              <input name="courseSlug" type="hidden" value={course.slug} />
              <Button type="submit">Start course</Button>
            </form>
          )}
          <Button asChild variant="outline">
            <Link href="/courses">Back to catalog</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CourseSyllabus({
  course,
  syllabus,
  completionByModule,
  prerequisiteLabels,
}: {
  course: CourseRow;
  syllabus: CourseSyllabusItem[];
  completionByModule: Map<string, CourseModuleCompletionRow>;
  prerequisiteLabels: Map<string, string[]>;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Learning path</h2>
        <p className="text-muted-foreground text-sm">
          Follow the path order for best results, or open any module when you
          need it.
        </p>
      </div>
      <div className="space-y-3">
        {syllabus.map((item, index) => {
          const completion = completionByModule.get(item.module_id) ?? null;
          return (
            <SyllabusRow
              key={item.module_id}
              course={course}
              item={item}
              index={index}
              isCompleted={Boolean(completion)}
              prerequisites={prerequisiteLabels.get(item.module_id) ?? []}
            />
          );
        })}
      </div>
    </section>
  );
}

function SyllabusRow({
  course,
  item,
  index,
  isCompleted,
  prerequisites,
}: {
  course: CourseRow;
  item: CourseSyllabusItem;
  index: number;
  isCompleted: boolean;
  prerequisites: string[];
}) {
  const href = `/courses/${course.slug}/m/${item.module.slug}`;
  const status = isCompleted ? "Completed" : "Not started";
  const prereqLabel =
    prerequisites.length > 0
      ? `Suggested after: ${prerequisites.join(", ")}`
      : index === 0
        ? "Start anytime"
        : "Best followed in path order";

  return (
    <Card className="border-border/60">
      <CardContent>
        <div className="flex gap-4">
          <div
            className={cn(
              "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
              isCompleted
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground",
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-medium leading-snug">
                  {item.module.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {moduleSummary(item.module)}
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant={isCompleted ? "outline" : "default"}
              >
                <Link href={href}>
                  {isCompleted ? "Review module" : "Open module"}
                </Link>
              </Button>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <Badge variant={isCompleted ? "secondary" : "outline"}>
                {status}
              </Badge>
              {item.role ? (
                <Badge variant="outline">{formatDomain(item.role)}</Badge>
              ) : null}
              {item.module.duration_min ? (
                <Badge variant="outline">
                  {formatMinutes(item.module.duration_min)}
                </Badge>
              ) : null}
              {item.module.difficulty ? (
                <Badge variant="outline">
                  {formatDomain(item.module.difficulty)}
                </Badge>
              ) : null}
              <Badge variant="outline">{prereqLabel}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EnrollmentCard({
  course,
  enrollment,
  progress,
  moduleCount,
  durationMinutes,
  nextModuleTitle,
  resumeHref,
  startAction,
}: {
  course: CourseRow;
  enrollment: CourseEnrollmentRow | null;
  progress: CourseProgressCache;
  moduleCount: number;
  durationMinutes: number;
  nextModuleTitle: string | null;
  resumeHref: string;
  startAction: CourseDetailProps["startAction"];
}) {
  if (enrollment) {
    return (
      <ProgressCard
        progress={{
          eyebrow: "Continue course",
          title: course.title,
          summary: nextModuleTitle
            ? `Next: ${nextModuleTitle}`
            : "Review your course path.",
          percent: progress.percent,
          progressLabel: `${progress.percent}% complete`,
          stats: [
            {
              label: `${progress.completed_module_count} of ${progress.total_module_count} required modules`,
            },
          ],
          action: {
            label: progress.percent === 100 ? "Review course" : "Resume",
            href: resumeHref,
            ariaLabel: `Resume ${course.title}`,
          },
          accent: <PlayCircle className="size-5" />,
        }}
      />
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Start this course</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="text-muted-foreground grid gap-2 text-sm">
          <Fact label="Modules" value={String(moduleCount)} />
          <Fact
            label="Duration"
            value={formatMinutes(durationMinutes) ?? "Self-paced"}
          />
          <Fact label="Reward" value={`+${courseXp(course)} XP completion`} />
        </dl>
        <p className="text-muted-foreground text-xs">
          Viewing this page does not enroll you. Use Start course when you are
          ready to track progress in this path.
        </p>
      </CardContent>
      <CardFooter>
        <form action={startAction} className="w-full">
          <input name="courseId" type="hidden" value={course.course_id} />
          <input name="courseSlug" type="hidden" value={course.slug} />
          <Button className="w-full" type="submit">
            Start course
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function CourseFactsCard({
  course,
  syllabus,
  durationMinutes,
}: {
  course: CourseRow;
  syllabus: CourseSyllabusItem[];
  durationMinutes: number;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Course facts</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-2 text-sm">
          <Fact label="Difficulty" value={courseDifficulty(syllabus)} />
          <Fact label="Version" value={course.version} />
          <Fact
            label="Status"
            value={formatDomain(course.status) ?? course.status}
          />
          <Fact
            label="Duration"
            value={formatMinutes(durationMinutes) ?? "Self-paced"}
          />
          <Fact label="XP" value={`+${courseXp(course)}`} />
          {/* <Fact label="Authors" value={formatAuthors(course.authors)} /> */}
        </dl>
      </CardContent>
    </Card>
  );
}

function PrerequisitesCard({
  prerequisites,
}: {
  prerequisites: Map<string, string[]>;
}) {
  const labels = Array.from(new Set(Array.from(prerequisites.values()).flat()));

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Suggested prereqs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {labels.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {labels.slice(0, 4).map((label) => (
              <li key={label} className="flex gap-2">
                <Circle className="text-muted-foreground mt-1 size-3 shrink-0" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">None required.</p>
        )}
        <p className="text-muted-foreground text-xs">
          These are recommendations, not locks. You can open modules out of
          order.
        </p>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function groupPrerequisites(prerequisites: CourseModulePrerequisite[]) {
  const grouped = new Map<string, string[]>();
  for (const prerequisite of prerequisites) {
    const labels = grouped.get(prerequisite.module_id) ?? [];
    labels.push(prerequisite.prereqModule.title);
    grouped.set(prerequisite.module_id, labels);
  }
  return grouped;
}

function getNextModule(
  syllabus: CourseSyllabusItem[],
  completions: Map<string, CourseModuleCompletionRow>,
) {
  return (
    syllabus.find(
      (item) => item.role !== "optional" && !completions.has(item.module_id),
    ) ??
    syllabus.find((item) => !completions.has(item.module_id)) ??
    syllabus[0] ??
    null
  );
}

function courseOutcomes(course: CourseRow, syllabus: CourseSyllabusItem[]) {
  const objectiveLabels = syllabus
    .flatMap((item) => jsonArray(item.module.learning_objectives))
    .filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
  const uniqueLabels = Array.from(new Set(objectiveLabels));
  if (uniqueLabels.length > 0) return uniqueLabels.slice(0, 4);

  return [
    `Build practical skill in ${formatDomain(course.domain_bucket) ?? "AI engineering"}.`,
    "Follow the module path with course-scoped progress.",
    "Prepare for read-only challenge previews.",
  ];
}

function challengeToPreview(
  course: CourseRow,
  challenge: ChallengeRow,
): ChallengePreviewCardViewModel {
  return {
    eyebrow: "Read-only preview",
    title: challenge.title,
    summary: markdownSummary(challenge.task_md),
    estimatedTimeLabel: formatMinutes(challenge.est_minutes),
    runtimeLabel: formatDomain(challenge.runtime) ?? challenge.runtime,
    statusLabel: "Preview only",
    action: {
      label: "Preview only",
      href: `/courses/${course.slug}#challenge-${challenge.slug}`,
      ariaLabel: `Preview challenge ${challenge.title}`,
    },
  };
}

function totalDuration(syllabus: CourseSyllabusItem[]) {
  return syllabus.reduce(
    (total, item) => total + (item.module.duration_min ?? 0),
    0,
  );
}

function courseDifficulty(syllabus: CourseSyllabusItem[]) {
  const labels = Array.from(
    new Set(
      syllabus
        .map((item) => item.module.difficulty)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  if (labels.length === 0) return "Mixed";
  if (labels.length === 1) return formatDomain(labels[0]) ?? labels[0];
  return "Mixed";
}

function moduleSummary(module: CourseSyllabusItem["module"]) {
  const firstObjective = jsonArray(module.learning_objectives).find(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  return (
    firstObjective ??
    module.search_text ??
    "A focused module in this course path."
  );
}

function courseXp(course: CourseRow) {
  return numberMetadata(course.metadata, "xp") ?? 100;
}

function formatAuthors(value: Json) {
  const authors = jsonArray(value)
    .map((author) => {
      if (typeof author === "string") return author;
      if (!author || typeof author !== "object" || Array.isArray(author))
        return null;
      const row = author as Record<string, Json | undefined>;
      return stringValue(row.name) ?? stringValue(row.title) ?? null;
    })
    .filter((author): author is string => Boolean(author));

  return authors.length > 0 ? authors.slice(0, 3).join(", ") : "AI Engineer";
}

function formatMinutes(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `~${hours}h` : `~${hours.toFixed(1)}h`;
}

function formatDomain(value: string | null | undefined) {
  if (!value) return undefined;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function compactLabel(parts: Array<string | undefined>) {
  const label = parts.filter(Boolean).join(" · ");
  return label.length > 0 ? label : undefined;
}

function markdownSummary(markdown: string) {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`-]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return (
    stripped ?? "Read the challenge brief before runnable challenges arrive."
  );
}

function jsonArray(value: Json) {
  return Array.isArray(value) ? value : [];
}

function numberMetadata(value: Json, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metadata = value as Record<string, Json | undefined>;
  const rawValue = metadata[key];
  return typeof rawValue === "number" && Number.isFinite(rawValue)
    ? rawValue
    : null;
}

function stringValue(value: Json | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
