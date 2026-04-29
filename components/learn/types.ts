import type { ReactNode } from "react";

export type LearnerBadgeVariant = "default" | "secondary" | "outline" | "ghost";

export type LearnerMetadataBadge = {
  label: string;
  variant?: LearnerBadgeVariant;
};

export type LearnerStat = {
  label: string;
  value?: string;
};

export type LearnerCardAction = {
  label: string;
  href: string;
  ariaLabel?: string;
};

export type LearnerCardViewModel = {
  eyebrow?: string;
  title: string;
  summary: string;
  badges?: LearnerMetadataBadge[];
  stats?: LearnerStat[];
  action: LearnerCardAction;
};

export type CourseCardViewModel = LearnerCardViewModel & {
  moduleCount?: number;
  durationLabel?: string;
  xpLabel?: string;
  capstoneLabel?: string;
};

export type ModuleCardViewModel = LearnerCardViewModel & {
  durationLabel?: string;
  xpLabel?: string;
  sourceCount?: number;
  quizLabel?: string;
  prerequisiteLabel?: string;
};

export type ChallengePreviewCardViewModel = LearnerCardViewModel & {
  runtimeLabel?: string;
  estimatedTimeLabel?: string;
  statusLabel?: string;
};

export type AssetCardViewModel = LearnerCardViewModel & {
  kindLabel: string;
  fileMetaLabel?: string;
  extractionLabel?: string;
  usedInLabel?: string;
};

export type ProgressCardViewModel = {
  eyebrow?: string;
  title: string;
  summary?: string;
  percent: number;
  progressLabel: string;
  stats?: LearnerStat[];
  action?: LearnerCardAction;
  accent?: ReactNode;
};
