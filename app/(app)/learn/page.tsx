import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
      <EmptyState
        icon={BookOpen}
        title="Learn hub ships in M5"
        description="Browse courses by layer, bucket, and difficulty. Resume the modules you started."
      />
    </div>
  );
}
