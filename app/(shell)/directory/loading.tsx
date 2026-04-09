import { Clapperboard, Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export default function DirectoryLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <div className="border-b border-sidebar-border p-4">
            <div className="h-8 w-32 animate-pulse rounded-md bg-sidebar-accent/60" />
          </div>
          <div className="space-y-2 p-3">
            <div className="h-9 w-full animate-pulse rounded-md bg-sidebar-accent/40" />
          </div>
          <div className="flex flex-1 flex-col gap-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-full animate-pulse rounded-md bg-sidebar-accent/30" />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            <span>Loading directory...</span>
          </div>
          <div className="flex-1 px-6 py-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-7 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-9 w-36" />
                </div>
              </div>
              <Skeleton className="h-4 max-w-xl" />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clapperboard className="size-4 opacity-70" aria-hidden />
                  <span>Loading talks...</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-video w-full rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
