import { Bot } from "lucide-react";

import { EmptyState } from "@/components/shell/empty-state";

export const metadata = { title: "Assistant" };

export default function AskPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Assistant</h1>
      <EmptyState
        icon={Bot}
        title="Streaming assistant ships in M4"
        description="Ask questions about anything in the corpus. Every answer cites the chunks it pulled — videos at timestamps, papers at sections."
      />
    </div>
  );
}
