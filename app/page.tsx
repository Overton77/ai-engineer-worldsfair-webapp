import { DirectoryExplorer } from "@/components/directory-explorer";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div
        className="border-b border-border bg-muted/50 px-4 py-2.5 text-center text-xs text-muted-foreground sm:text-sm"
        role="status"
      >
        Full AI Engineer course app coming soon — editor support and an integrated AI agent.
      </div>
      <div className="min-h-0 flex-1">
        <DirectoryExplorer />
      </div>
    </main>
  );
}
