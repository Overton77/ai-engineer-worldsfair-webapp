"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LearnerRouteErrorProps = {
  title: string;
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export function LearnerRouteError({
  title,
  error,
  unstable_retry,
}: LearnerRouteErrorProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive size-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            The learner catalog could not load. Try again in a moment.
          </p>
          {error.digest ? (
            <p className="text-muted-foreground font-mono text-xs">
              Error digest: {error.digest}
            </p>
          ) : null}
          <Button type="button" onClick={() => unstable_retry()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
