import { Loader2 } from "lucide-react";

export default function AppShellLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-12">
      <div className="flex items-center gap-3 rounded-full border border-border bg-background/95 px-5 py-3 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span>Loading workspace…</span>
      </div>
    </div>
  );
}
