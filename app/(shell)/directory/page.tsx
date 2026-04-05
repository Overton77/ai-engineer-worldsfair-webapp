import { DirectoryExplorer } from "@/components/directory-explorer";

export default function DirectoryPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div
        className="border-b border-border bg-muted/50 px-4 py-2.5 text-center text-xs text-muted-foreground sm:text-sm"
        role="status"
      >
        Full AI Engineer course app coming soon — editor support and an integrated
        AI agent. Sign in from the home screen for your dashboard.
      </div>
      <div className="min-h-0 flex-1">
        <DirectoryExplorer />
      </div>
    </main>
  );
}
