"use client";

import { Pencil } from "lucide-react";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, type ButtonProps } from "@/components/ui/button";
import type { EntityKind } from "@/lib/schema/entity-kind";
import { cn } from "@/lib/utils";

type NoteButtonProps = {
  entity: {
    kind: EntityKind;
    id: string;
    title: string;
  };
  /** When set, button label includes a count badge ("Note (3)"). */
  count?: number;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  iconOnly?: boolean;
  className?: string;
};

/**
 * Opens the global N1 NotesQuickDrawer by setting `?note=new` in the
 * URL with the entity ref encoded into `pinTo`. The drawer (mounted at
 * the app shell) listens to `?note=` and renders for any value.
 *
 * The drawer + URL contract are wired in U4.5; this button just sets
 * the URL param. Until then it lands a no-op visible param — that's
 * intentional so we can ship U4.1 → U4.5 incrementally without dead
 * placeholders.
 */
export function NoteButton({
  entity,
  count,
  size = "sm",
  variant = "outline",
  iconOnly = false,
  className,
}: NoteButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("note", "new");
    params.set("pinTo", `${entity.kind}:${entity.id}`);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const label = iconOnly
    ? null
    : count && count > 0
      ? `Note (${count})`
      : "Note";

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handleClick}
      aria-label={`Open notes for ${entity.title}`}
      className={cn(className)}
    >
      <Pencil className="size-3.5" />
      {label}
    </Button>
  );
}
