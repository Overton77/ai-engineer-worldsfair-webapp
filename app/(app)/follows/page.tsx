import { UsersRound } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Follows" };

export default function FollowsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Follows</h1>
      <EmptyState
        icon={UsersRound}
        title="Follow graph ships in M3"
        description="Follow people, organizations, libraries, categories, and layers. Updates from your follows land here."
      />
    </div>
  );
}
