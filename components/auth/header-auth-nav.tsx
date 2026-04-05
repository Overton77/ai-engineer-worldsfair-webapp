"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeaderAuthNav({
  user,
}: {
  user: { email?: string | null } | null;
}) {
  if (user) {
    return (
      <>
        <span
          className="hidden max-w-[12rem] truncate text-xs text-muted-foreground sm:inline"
          title={user.email ?? undefined}
        >
          {user.email}
        </span>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          Dashboard
        </Link>
        <SignOutButton variant="ghost" size="sm" />
      </>
    );
  }

  return (
    <Link
      href="/"
      className={cn(buttonVariants({ variant: "default", size: "sm" }))}
    >
      Sign in
    </Link>
  );
}
