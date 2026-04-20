"use client";

import * as React from "react";

import type { EntityKind } from "@/lib/schema/entity-kind";

export type NotesLayout = "split" | "theatre" | "focus" | "off";

const STORAGE_PREFIX = "aie:notes-layout:";

function storageKey(kind: EntityKind): string {
  return `${STORAGE_PREFIX}${kind}`;
}

function read(kind: EntityKind, fallback: NotesLayout): NotesLayout {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(storageKey(kind));
    if (v === "split" || v === "theatre" || v === "focus" || v === "off") {
      return v;
    }
  } catch {
    // ignore — privacy modes can throw on getItem
  }
  return fallback;
}

/**
 * Per-entity-kind preference for whether the notes pane is open by
 * default on dossiers. The drawer (N1) is always available; this just
 * controls whether the split (N2) / watch+notes (N3) shells start
 * open or off.
 */
export function useNotesLayout(
  kind: EntityKind,
  fallback: NotesLayout = "off",
): [NotesLayout, (next: NotesLayout) => void] {
  const [value, setValue] = React.useState<NotesLayout>(fallback);

  // Re-read on mount + when kind changes (no SSR-side reads to avoid
  // hydration mismatches).
  React.useEffect(() => {
    setValue(read(kind, fallback));
  }, [kind, fallback]);

  const set = React.useCallback(
    (next: NotesLayout) => {
      setValue(next);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey(kind), next);
        } catch {
          // ignore
        }
      }
    },
    [kind],
  );

  return [value, set];
}
