"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";

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
        <SignOutButton variant="ghost" size="sm" />
      </>
    );
  }

  return null;
}
