"use client";

import {
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

import { ENTITY_KINDS, type EntityKind } from "@/lib/schema/entity-kind";

const NOTES_LAYOUTS = ["split", "theatre", "focus"] as const;
export type NotesLayoutParam = (typeof NOTES_LAYOUTS)[number];

const KIND_SET = new Set<string>(ENTITY_KINDS);

export type ParsedPinTo = { kind: EntityKind; id: string } | null;

export function parsePinTo(raw: string | null | undefined): ParsedPinTo {
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx <= 0) return null;
  const kind = raw.slice(0, idx);
  const id = raw.slice(idx + 1);
  if (!KIND_SET.has(kind) || !id) return null;
  return { kind: kind as EntityKind, id };
}

export function encodePinTo(ref: { kind: EntityKind; id: string }): string {
  return `${ref.kind}:${ref.id}`;
}

/**
 * Centralised URL state for the notes invocation surfaces.
 *
 *   ?note=<id>  | "new"          → drawer (N1) open
 *   ?notes=split|theatre|focus    → split / theatre / focus mode on dossier
 *   ?pinTo=<kind>:<id>            → drawer's pinned entity (when note=new)
 *
 * The hook returns parsed values + a setter that accepts partial
 * updates. nuqs handles the URL serialisation + history pushes.
 */
export function useNoteUrlState() {
  const [params, setParams] = useQueryStates(
    {
      note: parseAsString.withDefault(""),
      notes: parseAsStringLiteral(NOTES_LAYOUTS),
      pinTo: parseAsString.withDefault(""),
    },
    { history: "replace", shallow: false },
  );

  const note = params.note || null;
  const notes = (params.notes ?? null) as NotesLayoutParam | null;
  const pinTo = parsePinTo(params.pinTo);

  return {
    note,
    notes,
    pinTo,
    /** Open drawer with an existing note id. */
    openDrawerNote: (id: string) =>
      setParams({ notes: null, note: id, pinTo: "" }),
    /** Open drawer creating a new note pinned to <ref>. */
    openDrawerNewNote: (ref?: { kind: EntityKind; id: string } | null) =>
      setParams({
        notes: null,
        note: "new",
        pinTo: ref ? encodePinTo(ref) : "",
      }),
    /** Select an existing note in the inline panel without waking the drawer. */
    openPanelNote: (id: string, layout: NotesLayoutParam = "split") =>
      setParams({ notes: notes ?? layout, note: id, pinTo: "" }),
    /** Open the inline panel without selecting a note yet. */
    openPanel: (layout: NotesLayoutParam = "split") =>
      setParams({ notes: notes ?? layout, pinTo: "" }),
    /** Clear active note state while leaving the inline panel open. */
    clearPanelNote: () => setParams({ note: "", pinTo: "" }),
    /** Close the inline panel and clear drawer-triggering note params too. */
    closePanelAndNote: () =>
      setParams({ notes: null, note: "", pinTo: "" }),
    setPanelLayout: (next: NotesLayoutParam | null) =>
      setParams({ notes: next }),
    /** Open drawer with an existing note id. */
    openNote: (id: string) =>
      setParams({ note: id, pinTo: "" }),
    /** Open drawer creating a new note pinned to <ref>. */
    openNewNote: (ref?: { kind: EntityKind; id: string } | null) =>
      setParams({ note: "new", pinTo: ref ? encodePinTo(ref) : "" }),
    closeNote: () => setParams({ note: "", pinTo: "" }),
    setLayout: (next: NotesLayoutParam | null) => setParams({ notes: next }),
  };
}
