import { ArrowRight, BookOpen, Boxes } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shell/empty-state";
import { Button } from "@/components/ui/button";

export function LearningEmptyState() {
  return (
    <EmptyState
      icon={BookOpen}
      title="Start learning"
      description="Choose a full course path or explore standalone modules at your own pace. Standalone modules do not automatically count for full-course credit."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild size="sm">
            <Link href="/courses">
              Browse courses <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/modules">
              Browse modules <Boxes className="size-3.5" />
            </Link>
          </Button>
        </div>
      }
    />
  );
}
