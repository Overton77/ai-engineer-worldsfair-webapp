"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { toggleSaveAction } from "@/app/actions/save";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

type SaveButtonProps = {
  entity: {
    kind: EntityKind;
    id: string;
    title: string;
    subtitle?: string | null;
  };
  initialSaved?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  /** When true, render only the icon (used in dense list rows). */
  iconOnly?: boolean;
  className?: string;
  /** Notified after a successful toggle so parents can refresh counters. */
  onChange?: (saved: boolean) => void;
};

export function SaveButton({
  entity,
  initialSaved = false,
  size = "sm",
  variant = "outline",
  iconOnly = false,
  className,
  onChange,
}: SaveButtonProps) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, startTransition] = React.useTransition();

  // Sync if SSR re-renders with a new initial value (e.g. after route
  // revalidation).
  React.useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const handleClick = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await toggleSaveAction({
        kind: entity.kind,
        id: entity.id,
        title: entity.title,
        subtitle: entity.subtitle ?? null,
        intent: next ? "save" : "unsaved",
      });
      if (!result.ok) {
        setSaved(!next);
        toast.error(result.error || "Failed to update saved");
        return;
      }
      onChange?.(next);
      toast.success(next ? "Saved" : "Removed", {
        description: entity.title,
        duration: 1800,
      });
    });
  };

  const Icon = saved ? BookmarkCheck : Bookmark;

  return (
    <Button
      type="button"
      size={size}
      variant={saved ? "secondary" : variant}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Unsave ${entity.title}` : `Save ${entity.title}`}
      className={cn(className)}
    >
      <Icon className={iconOnly ? "size-3.5" : "size-3.5"} />
      {iconOnly ? null : saved ? "Saved" : "Save"}
    </Button>
  );
}
