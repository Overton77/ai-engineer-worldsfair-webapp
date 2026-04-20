/**
 * Wizard step ordering. `welcome` and `done` are intro / outro screens
 * and don't count toward "Step N of M". Middle steps are numbered.
 */
export const WIZARD_STEPS = [
  "welcome",
  "identity",
  "interests",
  "goals",
  "layer",
  "done",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const NUMBERED_STEPS: WizardStep[] = [
  "identity",
  "interests",
  "goals",
  "layer",
];

export function isWizardStep(input: string): input is WizardStep {
  return (WIZARD_STEPS as readonly string[]).includes(input);
}

export function nextStep(current: WizardStep): WizardStep {
  const i = WIZARD_STEPS.indexOf(current);
  return WIZARD_STEPS[Math.min(i + 1, WIZARD_STEPS.length - 1)];
}

export function previousStep(current: WizardStep): WizardStep {
  const i = WIZARD_STEPS.indexOf(current);
  return WIZARD_STEPS[Math.max(i - 1, 0)];
}

export function stepNumber(step: WizardStep): {
  index: number;
  total: number;
} | null {
  const i = NUMBERED_STEPS.indexOf(step);
  if (i === -1) return null;
  return { index: i + 1, total: NUMBERED_STEPS.length };
}

export function hrefForStep(step: WizardStep): string {
  return `/onboarding/${step}`;
}
