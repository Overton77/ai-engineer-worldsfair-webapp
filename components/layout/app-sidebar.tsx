"use client";

import {
  Bookmark,
  Clapperboard,
  Landmark,
  Menu,
  NotebookPen,
  Presentation,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Viewer = { id: string; email?: string | null } | null;

const NAV_ITEMS = [
  { tab: "videos", label: "Videos", icon: Clapperboard },
  { tab: "persons", label: "People", icon: UserRound },
  { tab: "organizations", label: "Organizations", icon: Landmark },
  { tab: "sessions", label: "Sessions", icon: Presentation },
] as const;

const USER_NAV = [
  { href: "/notes", label: "My Notes", icon: NotebookPen },
  { href: "/saved", label: "Saved Items", icon: Bookmark },
] as const;

export function AppSidebar({
  viewer,
  activeTab,
  onTabChange,
}: {
  viewer: Viewer;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDirectory = pathname === "/directory";

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-14 z-50 size-8 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-sidebar-border p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Directory</p>
            <p className="text-[11px] text-muted-foreground">Browse the catalog</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
          <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Explore
          </p>
          {NAV_ITEMS.map(({ tab, label, icon: Icon }) => {
            const isActive = isDirectory && activeTab === tab;
            return (
              <Button
                key={tab}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  isActive && "bg-sidebar-accent",
                )}
                onClick={() => {
                  if (onTabChange) {
                    onTabChange(tab);
                    setMobileOpen(false);
                  }
                }}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                {label}
              </Button>
            );
          })}
        </nav>

        {viewer && (
          <>
            <Separator />
            <nav className="flex flex-col gap-0.5 p-2" aria-label="User">
              <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Your workspace
              </p>
              {USER_NAV.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group/button inline-flex h-8 w-full shrink-0 items-center justify-start gap-2 rounded-lg px-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </>
        )}

        <div className="mt-auto border-t border-sidebar-border p-3">
          {viewer ? (
            <p className="truncate text-xs text-muted-foreground" title={viewer.email ?? undefined}>
              {viewer.email}
            </p>
          ) : (
            <Link
              href="/"
              className="block text-center text-xs font-medium text-primary hover:underline"
            >
              Sign in for notes &amp; saved items
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
