import { LearningCard } from "@/components/learn/learning-card";
import type { CourseCardViewModel, LearnerStat } from "@/components/learn/types";

type CourseCardProps = {
  course: CourseCardViewModel;
  className?: string;
};

export function CourseCard({ course, className }: CourseCardProps) {
  const stats: LearnerStat[] = [
    ...(course.moduleCount !== undefined
      ? [{ label: `${course.moduleCount} ${course.moduleCount === 1 ? "module" : "modules"}` }]
      : []),
    ...(course.durationLabel ? [{ label: course.durationLabel }] : []),
    ...(course.xpLabel ? [{ label: course.xpLabel }] : []),
    ...(course.capstoneLabel ? [{ label: course.capstoneLabel }] : []),
    ...(course.stats ?? []),
  ];

  return (
    <LearningCard
      item={{
        ...course,
        stats,
        expandableSummary: true,
      }}
      className={className}
    />
  );
}
