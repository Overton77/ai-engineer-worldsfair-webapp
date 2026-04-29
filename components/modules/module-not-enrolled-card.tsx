import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CourseModuleRow, CourseRow } from "@/lib/db/learn";

type ModuleNotEnrolledCardProps = {
  course: CourseRow;
  module: CourseModuleRow;
  startAction: (formData: FormData) => void | Promise<void>;
};

export function ModuleNotEnrolledCard({
  course,
  module,
  startAction,
}: ModuleNotEnrolledCardProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-border/60 from-card via-card to-accent/5 bg-linear-to-br">
        <CardHeader>
          <CardTitle>This module belongs to {course.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Start the course to track course progress and earn course completion
            XP. Viewing this route does not enroll you automatically.
          </p>
          <p className="text-sm">
            You can still open <span className="font-medium">{module.title}</span>{" "}
            as a standalone module from the module library.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <form action={startAction}>
            <input name="courseId" type="hidden" value={course.course_id} />
            <input name="courseSlug" type="hidden" value={course.slug} />
            <input name="moduleSlug" type="hidden" value={module.slug} />
            <Button type="submit">Start course</Button>
          </form>
          <Button asChild variant="outline">
            <Link href={`/modules/${module.slug}`}>Open standalone module</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/courses/${course.slug}`}>Back to course</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
