"use client";

import { useMemo, useState, useTransition } from "react";
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
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  CATEGORY_TO_LAYER,
  DOMAIN_LAYER_META,
  POPULAR_CATEGORIES,
  type CategoryKey,
} from "@/lib/schema/taxonomy";

import { saveStepAction } from "../../actions";
import { hrefForStep } from "../../steps";

const MIN = 1;
const MAX = 8;

const CHIPS: Chip[] = CATEGORY_KEYS.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
  group: CATEGORY_TO_LAYER[value],
}));

const GROUP_LABELS = Object.fromEntries(
  Object.entries(DOMAIN_LAYER_META).map(([key, meta]) => [
    key,
    `${meta.code} — ${meta.label}`,
  ]),
);

export function InterestsStep({
  initialTags,
}: {
  initialTags: string[];
}) {
  const [tags, setTags] = useState<string[]>(() =>
    initialTags.filter((t): t is CategoryKey =>
      (CATEGORY_KEYS as readonly string[]).includes(t),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canContinue = tags.length >= MIN;

  const summary = useMemo(() => {
    if (tags.length === 0) return "Pick at least one category to continue.";
    const layers = new Set(
      tags.map((t) => CATEGORY_TO_LAYER[t as CategoryKey]),
    );
    const layerLabels = [...layers]
      .map((l) => DOMAIN_LAYER_META[l].label)
      .join(", ");
    return `${tags.length} selected · spans ${layerLabels}`;
  }, [tags]);

  function onSubmit() {
    if (!canContinue) {
      setError("Pick at least one category to personalise your home.");
      return;
    }
    start(async () => {
      setError(null);
      const result = await saveStepAction("interests", {
        interest_tags: tags as CategoryKey[],
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>What do you want to learn about?</CardTitle>
        <CardDescription>
          Pick {MIN}–{MAX} categories. We&apos;ll surface people, talks,
          libraries, and modules in these spaces first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChipPicker
          options={CHIPS}
          value={tags}
          onChange={setTags}
          min={MIN}
          max={MAX}
          popularValues={POPULAR_CATEGORIES}
          groupLabels={GROUP_LABELS}
          searchPlaceholder="Search 26 categories…"
        />
        <p className="text-muted-foreground mt-4 text-xs">{summary}</p>
        {error ? (
          <p className="text-destructive mt-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardContent className="flex items-center justify-between border-t pt-5">
        <Button asChild variant="ghost" size="sm">
          <Link href={hrefForStep("identity")}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={pending || !canContinue}
        >
          {pending ? "Saving…" : "Continue"}
          {!pending ? <ArrowRight className="size-4" /> : null}
        </Button>
      </CardContent>
    </Card>
  );
}
