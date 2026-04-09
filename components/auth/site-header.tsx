import { Cpu } from "lucide-react";
import Link from "next/link";

import { HeaderAuthNav } from "@/components/auth/header-auth-nav";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2.5">
        <Link
          href="/directory"
          className="flex items-center gap-2 text-foreground hover:opacity-90"
        >
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Cpu className="size-4" />
          </div>
          <span className="truncate text-sm font-semibold tracking-tight">
            AI Engineer
          </span>
        </Link>
      </div>
      <nav className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <HeaderAuthNav user={user} />
      </nav>
    </header>
  );
}
