import { notFound } from "next/navigation";

import { CourseDetail } from "@/components/courses/course-detail";
import { requireUser } from "@/lib/auth/require-user";
import {
  getCourseBySlug,
  getCourseProgress,
  getCourseSyllabus,
  getEnrollment,
  listChallengesForCourse,
  listCourseModuleCompletions,
  listCourseModulePrerequisites,
} from "@/lib/db/learn";

import { startCourseAction } from "./actions";

export const metadata = { title: "Course" };

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const [{ slug }, user] = await Promise.all([params, requireUser()]);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [enrollment, progress, syllabus, completions, challenges] =
    await Promise.all([
      getEnrollment(user.id, course.course_id),
      getCourseProgress(user.id, course.course_id),
      getCourseSyllabus(course.course_id),
      listCourseModuleCompletions(user.id, course.course_id),
      listChallengesForCourse(course.course_id),
    ]);
  const prerequisites = await listCourseModulePrerequisites(
    syllabus.map((item) => item.module_id),
  );

  return (
    <CourseDetail
      course={course}
      enrollment={enrollment}
      progress={progress}
      syllabus={syllabus}
      completions={completions}
      prerequisites={prerequisites}
      challenges={challenges}
      startAction={startCourseAction}
    />
  );
}
