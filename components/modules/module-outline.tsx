import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { ProgressCard } from "@/components/learn/progress-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CourseModuleCompletionRow,
  CourseModulePrerequisite,
  CourseProgressCache,
  CourseRow,
  CourseSyllabusItem,
  ModuleCompletionRow,
} from "@/lib/db/learn";
import { cn } from "@/lib/utils";

import type { ModuleHeading } from "./module-reader-utils";
import { formatMinutes } from "./module-reader-utils";

type StandaloneOutlineProps = {
  mode: "standalone";
  headings: ModuleHeading[];
  prerequisites: CourseModulePrerequisite[];
  completion: ModuleCompletionRow | null;
};

type CourseOutlineProps = {
  mode: "course";
  course: CourseRow;
  syllabus: CourseSyllabusItem[];
  currentModuleId: string;
  progress: CourseProgressCache;
  completions: CourseModuleCompletionRow[];
  prerequisites: CourseModulePrerequisite[];
};

type ModuleOutlineProps = StandaloneOutlineProps | CourseOutlineProps;

export function ModuleOutline(props: ModuleOutlineProps) {
  if (props.mode === "course") return <CourseModuleOutline {...props} />;
  return <StandaloneModuleOutline {...props} />;
}

function StandaloneModuleOutline({
  headings,
  prerequisites,
  completion,
}: StandaloneOutlineProps) {
  const prereqLabels = Array.from(
    new Set(prerequisites.map((item) => item.prereqModule.title)),
  );

  return (
    <aside className="space-y-4">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Module sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {headings.length > 0 ? (
            <nav className="space-y-1">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  className={cn(
                    "text-muted-foreground hover:text-foreground block rounded-md px-2 py-1 text-sm transition",
                    heading.depth === 3 && "pl-5 text-xs",
                  )}
                  href={`#${heading.id}`}
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          ) : (
            <p className="text-muted-foreground text-sm">
              Sections will appear here when the module has headings.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Suggested prereqs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {prereqLabels.length > 0 ? (
            <ul className="space-y-1">
              {prereqLabels.map((label) => (
                <li key={label} className="flex gap-2">
                  <Circle className="text-muted-foreground mt-1 size-3 shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>None required.</p>
          )}
          <Badge variant={completion ? "secondary" : "outline"}>
            {completion ? "Completed standalone" : "Not completed"}
          </Badge>
        </CardContent>
      </Card>
    </aside>
  );
}

function CourseModuleOutline({
  course,
  syllabus,
  currentModuleId,
  progress,
  completions,
  prerequisites,
}: CourseOutlineProps) {
  const completionIds = new Set(
    completions
      .filter((completion) => completion.course_version === course.version)
      .map((completion) => completion.module_id),
  );
  const prereqsByModuleId = groupPrerequisites(prerequisites);

  return (
    <aside className="space-y-4">
      <ProgressCard
        progress={{
          eyebrow: "Course progress",
          title: course.title,
          percent: progress.percent,
          progressLabel: `${progress.percent}% complete`,
          stats: [
            {
              label: `${progress.completed_module_count} of ${progress.total_module_count} required modules`,
            },
          ],
          action: {
            label: "Course",
            href: `/courses/${course.slug}`,
            ariaLabel: `Back to ${course.title}`,
          },
          accent: <PlayCircle className="size-5" />,
        }}
      />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Course outline</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-2">
            {syllabus.map((item, index) => {
              const isCurrent = item.module_id === currentModuleId;
              const isCompleted = completionIds.has(item.module_id);
              return (
                <Link
                  key={item.module_id}
                  className={cn(
                    "border-border/60 hover:bg-muted/60 block rounded-lg border p-2 text-sm transition",
                    isCurrent && "border-primary bg-primary/5",
                  )}
                  href={`/courses/${course.slug}/m/${item.module.slug}`}
                >
                  <span className="flex gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                    ) : (
                      <span className="text-muted-foreground mt-0.5 flex size-4 shrink-0 items-center justify-center text-xs">
                        {index + 1}
                      </span>
                    )}
                    <span className="min-w-0 space-y-1">
                      <span className="block font-medium leading-snug">
                        {item.module.title}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {formatMinutes(item.module.duration_min) ?? "Self-paced"}
                        {isCurrent ? " · Current" : ""}
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Soft prereqs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(prereqsByModuleId.get(currentModuleId) ?? []).length > 0 ? (
            <ul className="space-y-1">
              {(prereqsByModuleId.get(currentModuleId) ?? []).map((label) => (
                <li key={label} className="flex gap-2">
                  <Circle className="text-muted-foreground mt-1 size-3 shrink-0" />
                  <span>Suggested after: {label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>None required.</p>
          )}
          <p className="text-muted-foreground text-xs">
            Prerequisites are guidance, not locks.
          </p>
        </CardContent>
      </Card>
    </aside>
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
