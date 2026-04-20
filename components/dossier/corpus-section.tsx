import { cn } from "@/lib/utils";
import type { EntitySummary } from "@/types/domain";

import { EntityCard, type EntityCardVariant } from "../explore/entity-card";

type CorpusGroup = {
  label: string;
  items: readonly EntitySummary[];
  variant?: EntityCardVariant;
  emptyHint?: string;
};

type CorpusSectionProps = {
  groups: readonly CorpusGroup[];
  className?: string;
};

export function CorpusSection({ groups, className }: CorpusSectionProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {groups.map((group) => {
        const variant = group.variant ?? "result";
        const layoutClass =
          variant === "media"
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-2";
        return (
          <section key={group.label} className="flex flex-col gap-3">
            <header className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold tracking-tight">
                {group.label}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  ({group.items.length})
                </span>
              </h3>
            </header>
            {group.items.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">
                {group.emptyHint ?? "Nothing indexed here yet."}
              </p>
            ) : (
              <div className={layoutClass}>
                {group.items.map((item) => (
                  <EntityCard
                    key={`${item.kind}:${item.id}`}
                    entity={item}
                    variant={variant}
                    actions={false}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
