"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AvatarProps = React.ComponentProps<"span"> & {
  size?: "sm" | "md" | "lg";
};

function Avatar({ className, size = "md", ...props }: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "bg-muted ring-border/60 relative inline-flex shrink-0 overflow-hidden rounded-full ring-1",
        size === "sm" && "size-7",
        size === "md" && "size-9",
        size === "lg" && "size-12",
        className,
      )}
      {...props}
    />
  );
}

type AvatarImageProps = React.ComponentProps<"img"> & {
  /** Hide the image until it loads to avoid the broken-image flash. */
};

function AvatarImage({ className, alt = "", ...props }: AvatarImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      data-slot="avatar-image"
      alt={alt}
      className={cn(
        "size-full object-cover transition-opacity",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted text-muted-foreground absolute inset-0 inline-flex items-center justify-center text-xs font-medium",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
