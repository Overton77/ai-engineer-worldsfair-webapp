import { Notebook } from "lucide-react";

export function NotesPlaceholder() {
  return (
    <div className="border-border/60 bg-muted/30 flex flex-col items-center gap-2 rounded-xl border p-8 text-center">
      <Notebook className="text-muted-foreground size-7" />
      <p className="text-sm font-medium">Notes ship in M3</p>
      <p className="text-muted-foreground text-xs">
        You&rsquo;ll be able to pin freeform notes to this dossier when the
        notes workspace lands.
      </p>
    </div>
  );
}
