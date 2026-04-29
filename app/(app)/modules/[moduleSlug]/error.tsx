"use client";

import { LearnerRouteError } from "@/components/learn/learner-route-error";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <LearnerRouteError
      title="Module could not load"
      error={error}
      unstable_retry={unstable_retry}
    />
  );
}
