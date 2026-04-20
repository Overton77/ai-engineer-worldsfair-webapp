"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const ORDER = ["light", "dark", "system"] as const;

/**
 * Cycles light → dark → system. Renders the icon for the *current*
 * resolved theme so the affordance matches the visible state.
 */
export function ThemeToggle() {
  const { theme = "system", setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const next = () => {
    const i = ORDER.indexOf(theme as (typeof ORDER)[number]);
    setTheme(ORDER[(i + 1) % ORDER.length]);
  };

  const Icon = !mounted
    ? Monitor
    : theme === "system"
      ? Monitor
      : (resolvedTheme ?? theme) === "dark"
        ? Moon
        : Sun;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle color theme"
      onClick={next}
    >
      <Icon className="size-4" />
    </Button>
  );
}
