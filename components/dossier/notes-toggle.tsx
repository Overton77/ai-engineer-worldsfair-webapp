"use client";

import { Columns, Notebook } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotesLayout } from "@/lib/hooks/use-notes-layout";
import { useNoteUrlState } from "@/lib/notes/use-note-url-state";
import type { EntityKind } from "@/lib/schema/entity-kind";

type Props = {
  entityKind: EntityKind;
  count: number;
  /** Optional: video pages can pass `theatre` as the alt mode. */
  defaultLayout?: "split" | "theatre" | "focus";
};

/**
 * Dossier hero "║ Notes" button. Reads `?notes=` to know the current
 * layout, persists the user's choice per-kind via useNotesLayout so
 * the next visit defaults the same way.
 *
 * - Off → Click flips to the user's last preferred layout (split by
 *   default).
 * - Open → Click hides the pane (sets ?notes= absent + remembers
 *   "off").
 */
export function DossierNotesToggle({
  entityKind,
  count,
  defaultLayout = "split",
}: Props) {
  const { notes, setLayout } = useNoteUrlState();
  const [pref, setPref] = useNotesLayout(entityKind, "off");
  const isOpen = notes === "split" || notes === "theatre" || notes === "focus";

  // First-mount: if URL doesn't say anything but the user previously
  // chose split/theatre/focus for this kind, restore it.
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (!isOpen && pref !== "off") {
      setLayout(pref);
    }
  }, [isOpen, pref, setLayout]);

  const onClick = () => {
    if (isOpen) {
      setPref("off");
      setLayout(null);
    } else {
      const next = pref !== "off" ? pref : defaultLayout;
      setPref(next);
      setLayout(next);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isOpen ? "secondary" : "outline"}
      onClick={onClick}
      aria-pressed={isOpen}
      aria-label={isOpen ? "Hide notes pane" : "Show notes pane"}
      title={isOpen ? "Hide notes pane" : "Show notes pane"}
    >
      <Columns className="size-3.5" />
      <Notebook className="size-3.5 -ml-0.5" />
      Notes
      {count > 0 ? (
        <Badge variant="outline" className="text-[10px]">
          {count}
        </Badge>
      ) : null}
    </Button>
  );
}
