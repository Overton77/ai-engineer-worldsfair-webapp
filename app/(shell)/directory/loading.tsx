import { Clapperboard, Loader2 } from "lucide-react";

export default function DirectoryLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div
        className="border-b border-border bg-muted/50 px-4 py-2.5 text-center text-xs text-muted-foreground sm:text-sm"
        role="status"
      >
        Full AI Engineer course app coming soon — editor support and an integrated AI agent. Sign in from the home
        screen for your dashboard.
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[min(100%,280px)] shrink-0 flex-col border-r border-border bg-sidebar">
          <div className="border-b border-sidebar-border p-4">
            <div className="h-10 w-36 animate-pulse rounded-md bg-sidebar-accent/60" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-9 w-full animate-pulse rounded-md bg-sidebar-accent/40" />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-2">
            {(["videos", "persons", "orgs", "sessions"] as const).map((k) => (
              <div key={k} className="h-9 w-full animate-pulse rounded-md bg-sidebar-accent/30" />
            ))}
          </div>
          <div className="mt-auto border-t border-sidebar-border p-2">
            <div className="h-9 w-full animate-pulse rounded-md bg-sidebar-accent/40" />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
          <Loader2 className="size-10 animate-spin text-muted-foreground" aria-hidden />
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clapperboard className="size-4 opacity-70" aria-hidden />
            <span>Loading directory…</span>
          </div>
          <p className="max-w-md text-center text-xs text-muted-foreground">
            Fetching people, organizations, sessions, and YouTube recordings.
          </p>
        </div>
      </div>
    </main>
  );
}
