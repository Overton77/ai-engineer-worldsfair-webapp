"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type LayerCardProps = {
  code: string;
  label: string;
  tagline: string;
  selected: boolean;
  onSelect: () => void;
};

export function LayerCard({
  code,
  label,
  tagline,
  selected,
  onSelect,
}: LayerCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group/layer text-left transition-all",
        "border-border/70 bg-background/60 hover:border-primary/40 hover:bg-card relative w-full overflow-hidden rounded-xl border p-4",
        selected && "border-primary bg-primary/5 ring-primary/20 ring-2",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="from-primary/15 to-accent/10 inline-flex items-center justify-center rounded-md bg-gradient-to-br px-2 py-1 font-mono text-xs font-semibold">
          {code}
        </div>
        {selected ? (
          <span className="bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full">
            <Check className="size-3" />
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 text-base font-semibold">{label}</h3>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        {tagline}
      </p>
    </button>
  );
}
