import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type LearnerPageSkeletonProps = {
  cards?: number;
  showHero?: boolean;
};

export function LearnerPageSkeleton({
  cards = 4,
  showHero = true,
}: LearnerPageSkeletonProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </header>

      {showHero ? (
        <Card className="border-border/60">
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index} className="border-border/60">
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
