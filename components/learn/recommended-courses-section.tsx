import Link from "next/link";

import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import type { CourseCatalogItem } from "@/lib/db/learn";

import { courseToCardViewModel } from "./view-models";

type RecommendedCoursesSectionProps = {
  courses: CourseCatalogItem[];
};

export function RecommendedCoursesSection({
  courses,
}: RecommendedCoursesSectionProps) {
  if (courses.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Recommended courses</h2>
          <p className="text-muted-foreground text-sm">
            Structured paths for production AI engineering.
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/courses">See all</Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {courses.map((item) => (
          <CourseCard
            key={item.course.course_id}
            course={courseToCardViewModel(item)}
          />
        ))}
      </div>
    </section>
  );
}
