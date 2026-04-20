import { Compass } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Explore" };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
      <EmptyState
        icon={Compass}
        title="Directory ships in M2"
        description="People, organizations, libraries, papers, talks, videos, and events — all browsable, all filterable. Coming with the exploration milestone."
      />
    </div>
  );
}
