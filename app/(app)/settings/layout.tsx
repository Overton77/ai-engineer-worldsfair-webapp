import Link from "next/link";

import { Settings, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, public visibility, and account.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <SettingsNav />
        <div>{children}</div>
      </div>
    </div>
  );
}

function SettingsNav() {
  return (
    <nav className="md:border-border/60 flex gap-1 overflow-auto md:flex-col md:border-r md:pr-4">
      <SettingsNavLink href="/settings/profile" label="Profile" icon={<UserRound className="size-4" />} />
      <SettingsNavLink href="/settings/account" label="Account" icon={<Settings className="size-4" />} />
    </nav>
  );
}

function SettingsNavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
