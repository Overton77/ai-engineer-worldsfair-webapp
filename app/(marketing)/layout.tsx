import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <header className="border-border/60 bg-background/70 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Logo />
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
            <a className="hover:text-foreground" href="#explore">
              Explore
            </a>
            <a className="hover:text-foreground" href="#capture">
              Capture
            </a>
            <a className="hover:text-foreground" href="#learn">
              Learn
            </a>
          </nav>
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-border/60 text-muted-foreground border-t py-8 text-center text-xs">
        Built for the engineers shipping the next decade of AI.
      </footer>
    </div>
  );
}
