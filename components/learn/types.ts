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

export type LearnerCardImage = {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  dominantColor?: string | null;
  focalX?: number | null;
  focalY?: number | null;
};

export type LearnerCardViewModel = {
  /** Course-style cards: domain bucket shown as the primary track label. */
  categoryLabel?: string;
  eyebrow?: string;
  title: string;
  summary: string;
  image?: LearnerCardImage | null;
  badges?: LearnerMetadataBadge[];
  stats?: LearnerStat[];
  action: LearnerCardAction;
  /** When true, summary uses a show more / show less control instead of a hard line clamp. */
  expandableSummary?: boolean;
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
