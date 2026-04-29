import { GraduationCap } from "lucide-react";

import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourseCatalogItem } from "@/lib/db/learn";

import { courseToCardViewModel } from "@/components/learn/view-models";

type CourseCatalogProps = {
  courses: CourseCatalogItem[];
  totalCount: number;
  query: string;
};

export function CourseCatalog({ courses, totalCount, query }: CourseCatalogProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Structured learning paths for production AI engineering.
        </p>
      </header>

      <form className="border-border/60 bg-card/60 rounded-xl border p-3">
        <label className="text-muted-foreground mb-2 block text-xs font-medium">
          Search courses
        </label>
        <div className="flex gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search courses..."
            type="search"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {courses.length.toLocaleString()} of {totalCount.toLocaleString()}{" "}
          published courses
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((item) => (
            <CourseCard
              key={item.course.course_id}
              course={courseToCardViewModel(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title={query ? "No matching courses" : "No published courses yet"}
          description={
            query
              ? "Try a different title, domain, layer, or summary search."
              : "Published full-course paths will appear here."
          }
        />
      )}
    </div>
  );
}
