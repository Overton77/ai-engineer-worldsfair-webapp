"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type ProgressDotsProps = {
  steps: number;
  current: number;
  className?: string;
};

export function ProgressDots({ steps, current, className }: ProgressDotsProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={steps}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${steps}`}
    >
      {Array.from({ length: steps }).map((_, i) => {
        const filled = i < current;
        const active = i === current - 1;
        return (
          <motion.span
            key={i}
            className={cn(
              "block h-1.5 rounded-full transition-colors",
              filled
                ? "bg-primary"
                : active
                  ? "bg-primary/60"
                  : "bg-muted",
              active ? "w-6" : "w-1.5",
            )}
            initial={false}
            animate={{ width: active ? 24 : 6 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          />
        );
      })}
    </div>
  );
}
