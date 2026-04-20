"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  /**
   * Pre-rendered icon ReactNode (e.g. `<Home className="size-4" />`).
   * We accept a node — not a component reference — so a Server
   * Component parent can render us without serialising a function
   * across the RSC boundary.
   */
  icon: React.ReactNode;
  label: string;
  badge?: string;
  exact?: boolean;
};

export function NavLink({
  href,
  icon,
  label,
  badge,
  exact,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname?.startsWith(href);
  return (
    <Link
      href={href}
      data-active={active ? "true" : undefined}
      className={cn(
        "group/nav text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active && "bg-primary/10 text-foreground",
        active && "[&_svg]:text-primary",
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-px text-[10px] font-medium">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
