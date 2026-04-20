import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
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
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {children}
      </main>
    </div>
  );
}
