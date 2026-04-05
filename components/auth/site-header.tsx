import Link from "next/link";

import { HeaderAuthNav } from "@/components/auth/header-auth-nav";
import { createServerSupabase } from "@/lib/supabase/server";

export async function SiteHeader() {
  let user: { email?: string | null } | null = null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    // Missing env — still show public shell.
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/directory"
          className="truncate text-sm font-semibold tracking-tight text-foreground hover:opacity-90"
        >
          AI Engineer World’s Fair
        </Link>
        <span className="hidden text-muted-foreground sm:inline">·</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Directory
        </span>
      </div>
      <nav className="flex shrink-0 items-center gap-2">
        <HeaderAuthNav user={user} />
      </nav>
    </header>
  );
}
