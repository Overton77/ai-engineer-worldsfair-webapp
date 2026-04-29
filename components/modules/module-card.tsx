import { LearningCard } from "@/components/learn/learning-card";
import type { LearnerStat, ModuleCardViewModel } from "@/components/learn/types";

type ModuleCardProps = {
  module: ModuleCardViewModel;
  className?: string;
};

export function ModuleCard({ module, className }: ModuleCardProps) {
  const stats: LearnerStat[] = [
    ...(module.durationLabel ? [{ label: module.durationLabel }] : []),
    ...(module.sourceCount !== undefined
      ? [
          {
            label: module.sourceCount === 1 ? "Source" : "Sources",
            value: String(module.sourceCount),
          },
        ]
      : []),
    ...(module.quizLabel ? [{ label: module.quizLabel }] : []),
    ...(module.xpLabel ? [{ label: module.xpLabel }] : []),
    ...(module.prerequisiteLabel ? [{ label: module.prerequisiteLabel }] : []),
    ...(module.stats ?? []),
  ];

  return (
    <LearningCard
      item={{
        ...module,
        stats,
      }}
      className={className}
    />
  );
}
