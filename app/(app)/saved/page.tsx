import { Bookmark } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
      <EmptyState
        icon={Bookmark}
        title="Save buttons go live in M3"
        description="Once dossiers ship, every entity gets a save / follow / note button. Your library will live here."
      />
    </div>
  );
}
