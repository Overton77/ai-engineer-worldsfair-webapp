"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVELS,
  ExperienceLevelSchema,
  type ExperienceLevel,
} from "@/lib/schema/taxonomy";
import { cn } from "@/lib/utils";

import { saveStepAction } from "../../actions";
import { hrefForStep } from "../../steps";

const FormSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(80, "Keep it under 80 characters."),
  headline: z
    .string()
    .trim()
    .max(140, "Keep it under 140 characters.")
    .optional(),
  experience_level: ExperienceLevelSchema.optional().nullable(),
});

type FormValues = z.infer<typeof FormSchema>;

const QUICK_LEVELS: ExperienceLevel[] = ["junior", "mid", "senior", "staff", "founder"];

export function IdentityStep({
  initialDisplayName,
  initialHeadline,
  initialExperienceLevel,
}: {
  initialDisplayName: string | null;
  initialHeadline: string | null;
  initialExperienceLevel: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError: setFieldError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      display_name: initialDisplayName ?? "",
      headline: initialHeadline ?? "",
      experience_level: (initialExperienceLevel as ExperienceLevel) ?? null,
    },
  });

  const experience = useWatch({ control, name: "experience_level" });

  function onSubmit(values: FormValues) {
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      const tree = parsed.error.flatten();
      for (const [field, msgs] of Object.entries(tree.fieldErrors)) {
        if (msgs && msgs[0]) {
          setFieldError(field as keyof FormValues, { message: msgs[0] });
        }
      }
      return;
    }
    start(async () => {
      setError(null);
      const result = await saveStepAction("identity", {
        display_name: parsed.data.display_name,
        headline: parsed.data.headline ?? null,
        experience_level: parsed.data.experience_level ?? null,
      });
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle>Who are you?</CardTitle>
        <CardDescription>
          A name we can greet you with, an optional headline, and your
          rough experience level. Everything is editable later.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          <Field label="Display name" htmlFor="display_name">
            <Input
              id="display_name"
              placeholder="Shreya Shankar"
              autoFocus
              {...register("display_name")}
            />
            {errors.display_name ? (
              <FieldError>{errors.display_name.message}</FieldError>
            ) : null}
          </Field>

          <Field
            label="Headline"
            hint="Shows on your profile."
            htmlFor="headline"
          >
            <Input
              id="headline"
              placeholder="AI-curious staff engineer @ ..."
              {...register("headline")}
            />
            {errors.headline ? (
              <FieldError>{errors.headline.message}</FieldError>
            ) : null}
          </Field>

          <Field label="Experience level">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Experience level">
              {QUICK_LEVELS.map((level) => {
                const on = experience === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() =>
                      setValue("experience_level", on ? null : level, {
                        shouldDirty: true,
                      })
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {EXPERIENCE_LEVEL_LABELS[level]}
                  </button>
                );
              })}
              <select
                value={experience ?? ""}
                onChange={(e) =>
                  setValue(
                    "experience_level",
                    (e.target.value || null) as ExperienceLevel | null,
                    { shouldDirty: true },
                  )
                }
                className="border-border bg-background text-muted-foreground rounded-full border px-3 py-1 text-xs"
                aria-label="More experience levels"
              >
                <option value="">More…</option>
                {EXPERIENCE_LEVELS.filter(
                  (l) => !QUICK_LEVELS.includes(l),
                ).map((l) => (
                  <option key={l} value={l}>
                    {EXPERIENCE_LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
          </Field>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardContent className="flex items-center justify-between border-t pt-5">
          <Button asChild variant="ghost" size="sm">
            <Link href={hrefForStep("welcome")}>
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Continue"}
            {!pending ? <ArrowRight className="size-4" /> : null}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-foreground text-sm font-medium"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-destructive text-xs" role="alert">
      {children}
    </p>
  );
}
