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
import {
  formatQuizPercent,
  type MiniQuizViewQuestion,
} from "@/lib/learn/module-quiz";

type ModuleQuizProps = {
  questions: MiniQuizViewQuestion[];
  threshold: number;
  actionInput: ModuleCompletionActionInput | CourseModuleCompletionActionInput;
  action: (
    input: ModuleCompletionActionInput | CourseModuleCompletionActionInput,
  ) => Promise<ModuleCompletionActionResult>;
  completed?: boolean;
  score?: number | null;
  attempts?: number | null;
};

export function ModuleQuiz({
  questions,
  threshold,
  actionInput,
  action,
  completed = false,
  score = null,
  attempts = null,
}: ModuleQuizProps) {
  const router = useRouter();
  const [selections, setSelections] = React.useState<Record<string, number>>({});
  const [result, setResult] = React.useState<ModuleCompletionActionResult | null>(
    null,
  );
  const [pending, startTransition] = React.useTransition();
  const selectedCount = Object.keys(selections).length;
  const canSubmit = selectedCount === questions.length && !completed;

  const submit = () => {
    startTransition(async () => {
      const nextResult = await action({ ...actionInput, selections });
      setResult(nextResult);
      if (nextResult.ok) {
        toast.success("Module complete", {
          description: nextResult.message,
          duration: 2500,
        });
        router.refresh();
      } else {
        toast.error("Quiz not passed", {
          description: nextResult.error,
        });
      }
    });
  };

  const displayScore = result?.ok
    ? result.score
    : result && "score" in result
      ? result.score
      : score;
  const displayThreshold = result && "threshold" in result ? result.threshold : threshold;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>Mini-quiz</CardTitle>
        <CardDescription>
          Passing score: {formatQuizPercent(displayThreshold) ?? "70%"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {completed ? (
          <CompletionSummary score={score} attempts={attempts} />
        ) : (
          questions.map((question, index) => (
            <fieldset key={question.id} className="space-y-3">
              <legend className="text-sm font-medium">
                {index + 1}. {question.prompt}
              </legend>
              <div className="grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const inputId = `${question.id}-${optionIndex}`;
                  return (
                    <label
                      key={inputId}
                      className="border-border/60 hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"
                      htmlFor={inputId}
                    >
                      <input
                        id={inputId}
                        name={question.id}
                        type="radio"
                        className="mt-1"
                        checked={selections[question.id] === optionIndex}
                        onChange={() =>
                          setSelections((current) => ({
                            ...current,
                            [question.id]: optionIndex,
                          }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))
        )}

        {result && !result.ok ? (
          <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
            {result.error}
            {"score" in result && typeof result.score === "number" ? (
              <span className="block">
                Score: {formatQuizPercent(result.score)} · Needed:{" "}
                {formatQuizPercent(result.threshold)}
              </span>
            ) : null}
          </div>
        ) : null}

        {result?.ok ? (
          <div className="border-border/60 bg-muted/40 rounded-lg border p-3 text-sm">
            {result.message}
            {typeof result.score === "number" ? (
              <span className="text-muted-foreground block">
                Score: {formatQuizPercent(result.score)}
              </span>
            ) : null}
          </div>
        ) : null}

        {!completed ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={!canSubmit || pending} onClick={submit}>
              {pending ? "Submitting..." : "Submit quiz"}
            </Button>
            <p className="text-muted-foreground text-xs">
              {selectedCount} of {questions.length} answered
            </p>
          </div>
        ) : null}

        {!completed && displayScore != null ? (
          <p className="text-muted-foreground text-xs">
            Last score shown here is local feedback until the page refreshes.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CompletionSummary({
  score,
  attempts,
}: {
  score: number | null | undefined;
  attempts: number | null | undefined;
}) {
  return (
    <div className="border-border/60 bg-muted/40 rounded-lg border p-3 text-sm">
      <p className="font-medium">Nice work. This module is complete.</p>
      <p className="text-muted-foreground">
        {formatQuizPercent(score) ? `Score ${formatQuizPercent(score)}` : "Score saved"}
        {attempts ? ` · ${attempts} attempt${attempts === 1 ? "" : "s"}` : ""}
      </p>
    </div>
  );
}
