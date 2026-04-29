import { notFound } from "next/navigation";

import { ModuleContent } from "@/components/modules/module-content";
import { ModuleNotEnrolledCard } from "@/components/modules/module-not-enrolled-card";
import { ModuleOutline } from "@/components/modules/module-outline";
import { ModuleReaderRail } from "@/components/modules/module-reader-rail";
import { ModuleReaderShell } from "@/components/modules/module-reader-shell";
import { requireUser } from "@/lib/auth/require-user";
import {
  getCourseBySlug,
  getCourseModuleMembership,
  getCourseProgress,
  getEnrollment,
  getCourseSyllabus,
  listChallengesForModule,
  listCourseModuleCompletions,
  listCourseModulePrerequisites,
} from "@/lib/db/learn";

import { startCourseFromModuleAction } from "./actions";

export const metadata = { title: "Course module" };

type CourseModulePageProps = {
  params: Promise<{ slug: string; moduleSlug: string }>;
};

export default async function CourseModulePage({
  params,
}: CourseModulePageProps) {
  const [{ slug, moduleSlug }, user] = await Promise.all([
    params,
    requireUser(),
  ]);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const syllabus = await getCourseSyllabus(course.course_id);
  const syllabusItem = syllabus.find((item) => item.module.slug === moduleSlug);
  if (!syllabusItem) notFound();

  const membership = await getCourseModuleMembership(
    course.course_id,
    syllabusItem.module_id,
  );
  if (!membership) notFound();

  const [enrollment, challenges] = await Promise.all([
    getEnrollment(user.id, course.course_id),
    listChallengesForModule(syllabusItem.module_id),
  ]);

  if (!enrollment) {
    return (
      <ModuleNotEnrolledCard
        course={course}
        module={syllabusItem.module}
        startAction={startCourseFromModuleAction}
      />
    );
  }

  const [progress, completions, prerequisites] = await Promise.all([
    getCourseProgress(user.id, course.course_id),
    listCourseModuleCompletions(user.id, course.course_id),
    listCourseModulePrerequisites(syllabus.map((item) => item.module_id)),
  ]);
  const completion =
    completions.find(
      (item) =>
        item.module_id === syllabusItem.module_id &&
        item.course_version === course.version,
    ) ?? null;

  return (
    <ModuleReaderShell
      outline={
        <ModuleOutline
          mode="course"
          course={course}
          syllabus={syllabus}
          currentModuleId={syllabusItem.module_id}
          progress={progress}
          completions={completions}
          prerequisites={prerequisites}
        />
      }
      content={
        <ModuleContent
          module={syllabusItem.module}
          contextLabel={`${course.title} · Module ${membership.ord + 1} of ${syllabus.length}`}
          completion={completion}
        />
      }
      rail={<ModuleReaderRail challenges={challenges} />}
    />
  );
}
