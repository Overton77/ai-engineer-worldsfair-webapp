"use server";

import { redirect } from "next/navigation";

import {
  setOnboardingStatus,
  updateProfileFields,
} from "@/lib/actions/profile";
import {
  ProfileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/actions/profile-schema";
import { track } from "@/lib/analytics";

import {
  hrefForStep,
  nextStep,
  type WizardStep,
} from "./steps";

export type StepResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Persist a step's allow-listed fields, advance `onboarding_status`,
 * and route to the next step. Throws via redirect on success — the
 * client form does not have to navigate manually.
 */
export async function saveStepAction(
  step: WizardStep,
  patch: ProfileUpdateInput,
): Promise<StepResult> {
  const parsed = ProfileUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    const tree = parsed.error.flatten();
    return {
      ok: false,
      error: "Invalid input.",
      fieldErrors: tree.fieldErrors as Record<string, string[]>,
    };
  }

  const update = await updateProfileFields(parsed.data);
  if (!update.ok) return { ok: false, error: update.error };

  const next = nextStep(step);
  // The wizard is "complete" only after the final numbered step (`layer`)
  // is saved; the `done` screen is recap-only.
  const status = next === "done" ? "complete" : "in_progress";
  const statusUpdate = await setOnboardingStatus({ status });
  if (!statusUpdate.ok) return { ok: false, error: statusUpdate.error };

  track("onboarding_step_completed", { step });

  redirect(hrefForStep(next));
}

/**
 * "Skip with sensible defaults" — flips status to `skipped` and routes
 * the user straight to the home shell. We do not write any defaults to
 * tag arrays; the rest of the app must degrade gracefully when the
 * profile is sparse.
 */
export async function skipOnboardingAction(): Promise<StepResult> {
  const update = await setOnboardingStatus({ status: "skipped" });
  if (!update.ok) return { ok: false, error: update.error };
  track("onboarding_skipped", {});
  redirect("/");
}

/**
 * Final "Start exploring" CTA from the recap screen. Onboarding has
 * already been marked `complete` by the `layer` save; this just routes.
 */
export async function finishOnboardingAction(): Promise<void> {
  track("onboarding_completed", {});
  redirect("/");
}
