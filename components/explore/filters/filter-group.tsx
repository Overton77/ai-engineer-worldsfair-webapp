"use client";

import * as React from "react";

import { Separator } from "@/components/ui/separator";

/** A single filter section heading + body wrapper. */
export function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Joins an array of group nodes with `<Separator />` between siblings,
 * skipping any nullish entries. Lets callers conditionally compose
 * groups without manually managing separator placement.
 */
export function FilterStack({ children }: { children: React.ReactNode }) {
  // React.Children.toArray already strips null/undefined/boolean.
  const visible = React.Children.toArray(children);
  return (
    <>
      {visible.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <Separator /> : null}
          {child}
        </React.Fragment>
      ))}
    </>
  );
}
