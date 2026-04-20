import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="from-primary/10 via-background to-accent/5 absolute inset-0 -z-10 bg-gradient-to-br"
      />
      <header className="border-border/60 border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-6">
          <Logo />
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/logout" prefetch={false}>
              Sign out
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 py-10 md:py-16">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
