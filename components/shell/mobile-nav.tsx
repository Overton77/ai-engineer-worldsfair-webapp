"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bookmark, Compass, Home, Notebook } from "lucide-react";

import { cn } from "@/lib/utils";

type MobileItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const ITEMS: MobileItem[] = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/notes", label: "Notes", icon: Notebook },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/learn", label: "Learn", icon: BookOpen },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-30 flex border-t backdrop-blur md:hidden">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-muted-foreground flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px]",
              active && "text-primary",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
