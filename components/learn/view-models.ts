import type {
  CourseCatalogItem,
  CourseProgressCache,
  CourseRow,
  LearnerHubCourse,
  ModuleCatalogItem,
  CourseModuleRow,
} from "@/lib/db/learn";
import type { Json } from "@/types/database.types";

import type {
  CourseCardViewModel,
  LearnerMetadataBadge,
  ModuleCardViewModel,
  ProgressCardViewModel,
} from "./types";

const DEFAULT_COURSE_XP = 100;
const DEFAULT_MODULE_XP = 25;

export function courseToCardViewModel(
  item: CourseCatalogItem,
): CourseCardViewModel {
  const metadata = objectMetadata(item.course.metadata);
  const xp = numberMetadata(metadata, "xp") ?? DEFAULT_COURSE_XP;

  return {
    eyebrow: compactLabel([
      formatDomain(item.course.domain_layer),
      formatDomain(item.course.domain_bucket),
      `Published v${item.course.version}`,
    ]),
    title: item.course.title,
    summary: item.course.summary ?? "A structured path for production AI learning.",
    moduleCount: item.moduleCount,
    durationLabel: formatCourseDuration(item.course, item.durationMinutes),
    xpLabel: `+${xp} XP`,
    capstoneLabel: item.course.capstone_challenge_id ? "Capstone preview" : undefined,
    action: {
      label: "View course",
      href: `/courses/${item.course.slug}`,
      ariaLabel: `View course ${item.course.title}`,
    },
  };
}

export function moduleToCardViewModel(
  item: ModuleCatalogItem,
): ModuleCardViewModel {
  const metadata = objectMetadata(item.module.metadata);
  const xp = numberMetadata(metadata, "xp") ?? DEFAULT_MODULE_XP;
  const badges: LearnerMetadataBadge[] = item.completion
    ? [{ label: "Completed", variant: "secondary" }]
    : [];

  return {
    eyebrow: compactLabel([
      formatDomain(item.module.domain_buckets[0]),
      formatDomain(item.module.difficulty),
    ]),
    title: item.module.title,
    summary: moduleSummary(item.module),
    badges,
    durationLabel: formatMinutes(item.module.duration_min),
    sourceCount: item.sourceCount,
    quizLabel: hasQuiz(item.module.mini_quiz) ? "Quiz" : undefined,
    xpLabel: `+${xp} XP`,
    action: {
      label: item.completion ? "Open module" : "Start module",
      href: `/modules/${item.module.slug}`,
      ariaLabel: `${item.completion ? "Open" : "Start"} module ${item.module.title}`,
    },
  };
}

export function hubCourseToProgressViewModel(
  item: LearnerHubCourse,
): ProgressCardViewModel {
  const nextTitle = item.nextModule?.title ?? "Review your course path";
  const moduleProgress = `${item.progress.completed_module_count} of ${item.progress.total_module_count} modules`;

  return {
    eyebrow: "Continue learning",
    title: item.course.title,
    summary: `Next: ${nextTitle}`,
    percent: item.progress.percent,
    progressLabel: `${item.progress.percent}% complete`,
    stats: [
      { label: moduleProgress },
      { label: `+${courseXp(item.course)} XP on completion` },
    ],
    action: {
      label: "Resume",
      href: item.nextModule
        ? `/courses/${item.course.slug}/m/${item.nextModule.slug}`
        : `/courses/${item.course.slug}`,
      ariaLabel: `Resume ${item.course.title}`,
    },
  };
}

export function progressFromJson(value: Json): CourseProgressCache | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, Json | undefined>;
  const completed = numberValue(row.completed_module_count);
  const total = numberValue(row.total_module_count);
  const percent = numberValue(row.percent);
  const courseVersion = stringValue(row.course_version);
  if (
    completed === null ||
    total === null ||
    percent === null ||
    courseVersion === null
  ) {
    return null;
  }

  return {
    completed_module_count: completed,
    total_module_count: total,
    percent,
    last_module_id: stringValue(row.last_module_id),
    last_completed_at: stringValue(row.last_completed_at),
    course_version: courseVersion,
  };
}

export function formatDomain(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function courseXp(course: CourseRow): number {
  return numberMetadata(objectMetadata(course.metadata), "xp") ?? DEFAULT_COURSE_XP;
}

function moduleSummary(module: CourseModuleRow): string {
  const objectives = arrayMetadata(module.learning_objectives);
  const firstObjective = objectives.find((item): item is string => typeof item === "string");
  return (
    firstObjective ??
    module.search_text ??
    "A focused standalone lesson you can complete outside full-course credit."
  );
}

function formatCourseDuration(
  course: CourseRow,
  durationMinutes: number | null,
): string | undefined {
  if (durationMinutes && durationMinutes > 0) return formatMinutes(durationMinutes);
  if (course.est_hours && course.est_hours > 0) return `~${course.est_hours}h`;
  return undefined;
}

function formatMinutes(minutes: number | null | undefined): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `~${hours}h` : `~${hours.toFixed(1)}h`;
}

function hasQuiz(value: Json): boolean {
  return Array.isArray(value) && value.length > 0;
}

function objectMetadata(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, Json | undefined>;
}

function arrayMetadata(value: Json): Json[] {
  return Array.isArray(value) ? value : [];
}

function numberMetadata(
  metadata: Record<string, Json | undefined>,
  key: string,
): number | null {
  return numberValue(metadata[key]);
}

function numberValue(value: Json | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(value: Json | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function compactLabel(parts: Array<string | undefined>): string | undefined {
  const label = parts.filter(Boolean).join(" · ");
  return label.length > 0 ? label : undefined;
}
