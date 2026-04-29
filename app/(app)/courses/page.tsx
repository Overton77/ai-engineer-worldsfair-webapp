import { CourseCatalog } from "@/components/courses/course-catalog";
import { listPublishedCourseCatalog } from "@/lib/db/learn";

export const metadata = { title: "Courses" };

type CoursesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const courses = await listPublishedCourseCatalog();
  const filteredCourses = query ? courses.filter((item) => matchesCourse(item, query)) : courses;

  return (
    <CourseCatalog
      courses={filteredCourses}
      totalCount={courses.length}
      query={query}
    />
  );
}

type CourseCatalogItem = Awaited<ReturnType<typeof listPublishedCourseCatalog>>[number];

function matchesCourse(item: CourseCatalogItem, query: string): boolean {
  const needle = query.toLowerCase();
  return [
    item.course.title,
    item.course.summary,
    item.course.domain_bucket,
    item.course.domain_layer,
    item.course.version,
  ]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLowerCase().includes(needle));
}
