"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChipPicker, type Chip } from "@/components/wizard/chip-picker";
import {
  GOAL_KEYS,
  GOAL_LABELS,
  type GoalKey,
} from "@/lib/schema/taxonomy";

import { saveStepAction } from "../../actions";
import { hrefForStep } from "../../steps";

const CHIPS: Chip[] = GOAL_KEYS.map((value) => ({
  value,
  label: GOAL_LABELS[value],
}));

export function GoalsStep({ initialGoals }: { initialGoals: string[] }) {
  const [goals, setGoals] = useState<string[]>(() =>
    initialGoals.filter((g): g is GoalKey =>
      (GOAL_KEYS as readonly string[]).includes(g),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onSubmit() {
    start(async () => {
      setError(null);
      const result = await saveStepAction("goals", {
        goals: goals as GoalKey[],
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Why are you here?</CardTitle>
        <CardDescription>
          Choose any that fit. We use this to surface the right modules
          and challenges in your home.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChipPicker
          options={CHIPS}
          value={goals}
          onChange={setGoals}
          searchable={false}
          max={6}
        />
        {error ? (
          <p className="text-destructive mt-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardContent className="flex items-center justify-between border-t pt-5">
        <Button asChild variant="ghost" size="sm">
          <Link href={hrefForStep("interests")}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <Button type="button" onClick={onSubmit} disabled={pending}>
          {pending ? "Saving…" : "Continue"}
          {!pending ? <ArrowRight className="size-4" /> : null}
        </Button>
      </CardContent>
    </Card>
  );
}
