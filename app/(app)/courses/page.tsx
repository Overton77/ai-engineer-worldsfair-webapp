import { GraduationCap } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
      <EmptyState
        icon={GraduationCap}
        title="Course catalog ships in M5"
        description="Multi-module courses with mini-quizzes, prereq DAGs, and a hands-on capstone challenge per course."
      />
    </div>
  );
}
