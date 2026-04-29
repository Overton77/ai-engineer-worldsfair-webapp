"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  CourseModuleCompletionActionInput,
  ModuleCompletionActionInput,
  ModuleCompletionActionResult,
} from "@/lib/learn/module-completion-actions";

type ModuleCompletionActionsProps = {
  actionInput: ModuleCompletionActionInput | CourseModuleCompletionActionInput;
  action: (
    input: ModuleCompletionActionInput | CourseModuleCompletionActionInput,
  ) => Promise<ModuleCompletionActionResult>;
  completed?: boolean;
};

export function ModuleCompletionActions({
  actionInput,
  action,
  completed = false,
}: ModuleCompletionActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<ModuleCompletionActionResult | null>(
    null,
  );

  const complete = () => {
    startTransition(async () => {
      const nextResult = await action(actionInput);
      setResult(nextResult);
      if (nextResult.ok) {
        toast.success("Module complete", {
          description: nextResult.message,
          duration: 2500,
        });
        router.refresh();
      } else {
        toast.error("Unable to complete module", {
          description: nextResult.error,
        });
      }
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Completion</CardTitle>
        <CardDescription>
          This module has no quiz. Mark it complete when you finish reading.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {completed ? (
          <div className="border-border/60 bg-muted/40 rounded-lg border p-3 text-sm">
            <p className="font-medium">Nice work. This module is complete.</p>
            <p className="text-muted-foreground">
              Your completion is saved for this learning context.
            </p>
          </div>
        ) : (
          <Button type="button" disabled={pending} onClick={complete}>
            {pending ? "Saving..." : "Mark complete"}
          </Button>
        )}

        {result ? (
          <div
            className={
              result.ok
                ? "border-border/60 bg-muted/40 rounded-lg border p-3 text-sm"
                : "border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm"
            }
          >
            {result.ok ? result.message : result.error}
            {result.ok && result.progress ? (
              <span className="text-muted-foreground block">
                Course progress: {result.progress.percent}%
              </span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
