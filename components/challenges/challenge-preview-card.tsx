import { LearningCard } from "@/components/learn/learning-card";
import type {
  ChallengePreviewCardViewModel,
  LearnerStat,
} from "@/components/learn/types";

type ChallengePreviewCardProps = {
  challenge: ChallengePreviewCardViewModel;
  className?: string;
};

export function ChallengePreviewCard({
  challenge,
  className,
}: ChallengePreviewCardProps) {
  const stats: LearnerStat[] = [
    ...(challenge.estimatedTimeLabel
      ? [{ label: challenge.estimatedTimeLabel }]
      : []),
    ...(challenge.runtimeLabel ? [{ label: challenge.runtimeLabel }] : []),
    ...(challenge.statusLabel ? [{ label: challenge.statusLabel }] : []),
    ...(challenge.stats ?? []),
  ];

  return (
    <LearningCard
      item={{
        ...challenge,
        stats,
      }}
      className={className}
      actionVariant="outline"
    />
  );
}
