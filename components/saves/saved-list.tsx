"use client";

import { Bookmark, Trash2, UsersRound } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { toggleFollowAction } from "@/app/actions/follow";
import { toggleSaveAction } from "@/app/actions/save";
import { Button } from "@/components/ui/button";
import type {
  EntityKind,
  FollowEntityKind,
} from "@/lib/schema/entity-kind";

import { SavedRow, type SavedRowItem } from "./saved-row";

type SavedListProps = {
  mode: "saved" | "follow";
  rows: SavedRowItem[];
};

export function SavedList({ mode, rows }: SavedListProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [removing, startRemoving] = React.useTransition();

  const allKeys = React.useMemo(
    () => new Set(rows.map((r) => `${r.kind}:${r.id}`)),
    [rows],
  );
  const allSelected = selected.size > 0 && selected.size === allKeys.size;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(allKeys);
  };

  const toggleOne = (k: string, next: boolean) => {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(k);
      else out.delete(k);
      return out;
    });
  };

  const onBulkRemove = () => {
    const refs = rows.filter((r) => selected.has(`${r.kind}:${r.id}`));
    startRemoving(async () => {
      const results = await Promise.allSettled(
        refs.map((r) =>
          mode === "saved"
            ? toggleSaveAction({
                kind: r.kind as EntityKind,
                id: r.id,
                title: r.title,
                subtitle: r.subtitle ?? null,
                intent: "unsaved",
              })
            : toggleFollowAction({
                kind: r.kind as FollowEntityKind,
                id: r.id,
                title: r.title,
                url: r.href,
                intent: "unfollow",
              }),
        ),
      );
      const failed = results.filter(
        (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok),
      ).length;
      if (failed > 0) {
        toast.error(
          `Removed ${refs.length - failed} of ${refs.length}; ${failed} failed`,
        );
      } else {
        toast.success(
          mode === "saved"
            ? `Removed ${refs.length} saved`
            : `Unfollowed ${refs.length}`,
        );
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  if (rows.length === 0) {
    const Icon = mode === "saved" ? Bookmark : UsersRound;
    return (
      <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-12 text-center">
        <Icon className="text-muted-foreground size-7" />
        <p className="text-base font-medium">
          {mode === "saved" ? "Nothing saved yet" : "Not following anyone yet"}
        </p>
        <p className="text-muted-foreground text-sm">
          {mode === "saved"
            ? "Hit the Save button on any dossier to start your library."
            : "Tap Follow on a person, org, library, category, or layer to subscribe."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-muted-foreground inline-flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            aria-label="Select all"
            checked={allSelected}
            onChange={toggleAll}
            className="border-input text-primary focus:ring-ring/40 size-4 rounded border focus:ring-2"
          />
          {selected.size === 0
            ? "Select"
            : `${selected.size} selected`}
        </label>
        {selected.size > 0 ? (
          <Button
            type="button"
            size="xs"
            variant="destructive"
            onClick={onBulkRemove}
            disabled={removing}
          >
            <Trash2 className="size-3" />
            {mode === "saved" ? "Remove selected" : "Unfollow selected"}
          </Button>
        ) : null}
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((r) => {
          const k = `${r.kind}:${r.id}`;
          return (
            <SavedRow
              key={k}
              mode={mode}
              item={r}
              checked={selected.has(k)}
              onCheckedChange={(next) => toggleOne(k, next)}
              onRemoved={() => router.refresh()}
            />
          );
        })}
      </ul>
    </div>
  );
}
