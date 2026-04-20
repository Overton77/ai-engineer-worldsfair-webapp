import { notFound, redirect } from "next/navigation";

import { getOwnProfile } from "@/lib/db/profile";

import { isWizardStep, stepNumber } from "../steps";
import { ProgressDots } from "@/components/wizard/progress-dots";
import { WelcomeStep } from "./_steps/welcome-step";
import { IdentityStep } from "./_steps/identity-step";
import { InterestsStep } from "./_steps/interests-step";
import { GoalsStep } from "./_steps/goals-step";
import { LayerStep } from "./_steps/layer-step";
import { DoneStep } from "./_steps/done-step";
import { SkipButton } from "./_steps/skip-button";

type Props = {
  params: Promise<{ step: string }>;
};

export default async function WizardStepPage({ params }: Props) {
  const { step } = await params;
  if (!isWizardStep(step)) notFound();

  const profile = await getOwnProfile();

  // If the user has already completed onboarding and revisits the
  // wizard, the proxy will already have redirected them. Belt-and-
  // braces: if they hit the URL directly during a navigation flicker,
  // bounce home.
  if (
    (profile.onboarding_status === "complete" ||
      profile.onboarding_status === "skipped") &&
    step !== "done"
  ) {
    redirect("/");
  }

  const num = stepNumber(step);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <ProgressDots
          steps={4}
          current={num ? num.index : step === "done" ? 4 : 0}
        />
        {step !== "welcome" && step !== "done" ? <SkipButton /> : null}
      </header>

      {step === "welcome" ? (
        <WelcomeStep displayName={profile.display_name} />
      ) : null}
      {step === "identity" ? (
        <IdentityStep
          initialDisplayName={profile.display_name}
          initialHeadline={profile.headline}
          initialExperienceLevel={profile.experience_level}
        />
      ) : null}
      {step === "interests" ? (
        <InterestsStep initialTags={profile.interest_tags ?? []} />
      ) : null}
      {step === "goals" ? (
        <GoalsStep initialGoals={profile.goals ?? []} />
      ) : null}
      {step === "layer" ? (
        <LayerStep initialLayer={profile.home_layer} />
      ) : null}
      {step === "done" ? <DoneStep profile={profile} /> : null}
    </div>
  );
}

// Skip prerender — the page reads the user's profile per-request.
export const dynamic = "force-dynamic";
