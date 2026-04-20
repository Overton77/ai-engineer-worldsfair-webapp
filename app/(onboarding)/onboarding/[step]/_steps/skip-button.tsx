"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

import { skipOnboardingAction } from "../../actions";

export function SkipButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-muted-foreground"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await skipOnboardingAction();
        })
      }
    >
      {pending ? "Skipping…" : "Skip for now"}
    </Button>
  );
}
