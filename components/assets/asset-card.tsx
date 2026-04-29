import { LearningCard } from "@/components/learn/learning-card";
import type { AssetCardViewModel, LearnerStat } from "@/components/learn/types";

type AssetCardProps = {
  asset: AssetCardViewModel;
  className?: string;
};

export function AssetCard({ asset, className }: AssetCardProps) {
  const stats: LearnerStat[] = [
    { label: asset.kindLabel },
    ...(asset.extractionLabel ? [{ label: asset.extractionLabel }] : []),
    ...(asset.fileMetaLabel ? [{ label: asset.fileMetaLabel }] : []),
    ...(asset.usedInLabel ? [{ label: asset.usedInLabel }] : []),
    ...(asset.stats ?? []),
  ];

  return (
    <LearningCard
      item={{
        ...asset,
        stats,
      }}
      className={className}
      actionVariant="outline"
    />
  );
}
