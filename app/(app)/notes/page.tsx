import { Notebook } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
      <EmptyState
        icon={Notebook}
        title="Note workspace ships in M3"
        description="Rich-text notes, entity mentions, autosave, and a Tiptap-powered editor. Pin notes to any entity in the corpus."
      />
    </div>
  );
}
