"use client";

import Link from "next/link";
import { LogOut, Settings, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ThemeToggle } from "./theme-toggle";

type UserMenuProps = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function initials(input: string): string {
  return input
    .replace(/@.*$/, "")
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("") || "?";
}

export function UserMenu({ email, displayName, avatarUrl }: UserMenuProps) {
  const label = displayName ?? email;

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Account menu"
            >
              <Avatar size="sm" className="size-7">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={label} />
                ) : null}
                <AvatarFallback>{initials(label)}</AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-0.5">
            <div className="text-foreground truncate text-sm font-medium">
              {displayName ?? "Signed in"}
            </div>
            <div className="text-muted-foreground truncate text-xs font-normal">
              {email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link href="/settings/profile">
                <UserIcon className="size-4" /> Profile
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link href="/settings/account">
                <Settings className="size-4" /> Settings
              </Link>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link
                href="/logout"
                prefetch={false}
                className="text-destructive"
              >
                <LogOut className="size-4" /> Sign out
              </Link>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
