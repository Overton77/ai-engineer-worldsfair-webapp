import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <div className="bg-primary/10 text-primary mb-4 inline-flex size-10 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </div>
      <h3 className="text-foreground text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-md text-sm text-balance">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
