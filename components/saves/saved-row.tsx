"use client";

import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { toggleFollowAction } from "@/app/actions/follow";
import { toggleSaveAction } from "@/app/actions/save";
import { EntityKindIcon } from "@/components/explore/entity-kind-chip";
import { NoteButton } from "@/components/save-follow/note-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  EntityKind,
  FollowEntityKind,
} from "@/lib/schema/entity-kind";
import { ENTITY_HREF } from "@/types/domain";

type RowMode = "saved" | "follow";

export type SavedRowItem = {
  /** Distinct kind union: SaveButton/EntityCard side uses EntityKind;
   *  Follow rows can also be category / domain_layer. */
  kind: EntityKind | "category" | "domain_layer";
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  /** Where the row links to. Computed by the page. */
  href: string;
  /** Display-only timestamp shown on the right. */
  ts: string;
};

type SavedRowProps = {
  mode: RowMode;
  item: SavedRowItem;
  /** Bulk-select state (controlled by the list). */
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
  /** Called after a successful remove so the parent can prune the row. */
  onRemoved?: () => void;
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function initialsOf(t: string): string {
  return t
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

export function SavedRow({
  mode,
  item,
  checked,
  onCheckedChange,
  onRemoved,
}: SavedRowProps) {
  const [pending, startTransition] = React.useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result =
        mode === "saved"
          ? await toggleSaveAction({
              kind: item.kind as EntityKind,
              id: item.id,
              title: item.title,
              subtitle: item.subtitle ?? null,
              intent: "unsaved",
            })
          : await toggleFollowAction({
              kind: item.kind as FollowEntityKind,
              id: item.id,
              title: item.title,
              url: item.href,
              intent: "unfollow",
            });
      if (!result.ok) {
        toast.error(result.error || "Failed to remove");
        return;
      }
      onRemoved?.();
      toast.success(mode === "saved" ? "Removed" : "Unfollowed", {
        description: item.title,
        duration: 1600,
      });
    });
  };

  const noteable =
    item.kind !== "category" && item.kind !== "domain_layer";

  return (
    <li
      data-row
      className="border-border/60 bg-card hover:border-border flex items-center gap-3 rounded-xl border p-3 transition-colors"
    >
      {onCheckedChange ? (
        <input
          type="checkbox"
          aria-label={`Select ${item.title}`}
          checked={checked ?? false}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="border-input text-primary focus:ring-ring/40 size-4 rounded border focus:ring-2"
        />
      ) : null}

      <Avatar className="size-9 shrink-0">
        {item.imageUrl ? <AvatarImage src={item.imageUrl} alt="" /> : null}
        <AvatarFallback className="text-[10px]">
          {initialsOf(item.title)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={item.href}
            className="hover:underline truncate text-sm font-medium tracking-tight"
          >
            {item.title}
          </Link>
          <span className="text-muted-foreground inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide">
            <EntityKindIcon
              kind={item.kind as EntityKind}
              className="size-3"
            />
            {labelOf(item.kind)}
          </span>
        </div>
        {item.subtitle ? (
          <p className="text-muted-foreground truncate text-xs">
            {item.subtitle}
          </p>
        ) : null}
      </div>

      <span className="text-muted-foreground hidden shrink-0 text-[10px] sm:inline">
        {mode === "saved" ? "saved " : "followed "}
        {relativeTime(item.ts)}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <Button asChild size="xs" variant="ghost" aria-label="Open">
          <Link href={item.href}>
            <ExternalLink className="size-3" />
            Open
          </Link>
        </Button>
        {noteable ? (
          <NoteButton
            entity={{
              kind: item.kind as EntityKind,
              id: item.id,
              title: item.title,
            }}
            size="xs"
            variant="ghost"
            iconOnly
          />
        ) : null}
        <Button
          type="button"
          size="xs"
          variant="ghost"
          aria-label={mode === "saved" ? "Remove" : "Unfollow"}
          onClick={handleRemove}
          disabled={pending}
        >
          <X className="size-3" />
        </Button>
      </div>
    </li>
  );
}

function labelOf(kind: string): string {
  if (kind === "category") return "Category";
  if (kind === "domain_layer") return "Layer";
  return kind
    .split("_")
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
}
