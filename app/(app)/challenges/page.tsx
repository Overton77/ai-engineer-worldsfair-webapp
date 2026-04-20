import { Trophy } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Arena" };

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Arena</h1>
      <EmptyState
        icon={Trophy}
        title="Challenges ship in M7"
        description="Code in a Monaco editor, run tests in a real sandbox, get scored by an LLM judge, and earn XP."
      />
    </div>
  );
}
