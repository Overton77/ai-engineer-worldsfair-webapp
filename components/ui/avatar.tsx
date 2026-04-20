"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type AvatarProps = React.ComponentProps<"span"> & {
  size?: "sm" | "md" | "lg";
};

type AvatarImageStateContext = {
  /** When true, a successful `AvatarImage` is on top; hide the solid fallback. */
  imageLoadSucceeded: boolean;
  setImageLoadSucceeded: React.Dispatch<React.SetStateAction<boolean>>;
};

const AvatarImageState = React.createContext<AvatarImageStateContext | null>(
  null,
);

function Avatar({ className, size = "md", ...props }: AvatarProps) {
  const [imageLoadSucceeded, setImageLoadSucceeded] = React.useState(false);
  const ctx = React.useMemo<AvatarImageStateContext>(
    () => ({ imageLoadSucceeded, setImageLoadSucceeded }),
    [imageLoadSucceeded, setImageLoadSucceeded],
  );

  return (
    <AvatarImageState.Provider value={ctx}>
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
    </AvatarImageState.Provider>
  );
}

type AvatarImageProps = React.ComponentProps<"img"> & {
  /** Hide the image until it loads to avoid the broken-image flash. */
};

function AvatarImage({
  className,
  alt = "",
  onLoad,
  onError,
  src,
  ...props
}: AvatarImageProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);
  const setImageLoadSucceeded = React.useContext(
    AvatarImageState,
  )?.setImageLoadSucceeded;

  // Cached images can finish loading before `onLoad` is attached, leaving
  // the image at opacity-0 forever (user only sees the fallback / initials).
  React.useLayoutEffect(() => {
    setFailed(false);
    setLoaded(false);
    setImageLoadSucceeded?.(false);
    const el = ref.current;
    if (el?.complete && el.naturalWidth > 0) {
      setLoaded(true);
      setImageLoadSucceeded?.(true);
    }
  }, [src, setImageLoadSucceeded]);

  if (failed) {
    return null;
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      ref={ref}
      data-slot="avatar-image"
      src={src}
      alt={alt}
      className={cn(
        "relative z-10 size-full object-cover transition-opacity",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        setLoaded(true);
        setImageLoadSucceeded?.(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setFailed(true);
        setImageLoadSucceeded?.(false);
        onError?.(e);
      }}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  const state = React.useContext(AvatarImageState);

  // The fallback is absolutely positioned on top of the <img> in the DOM. When
  // the image has loaded, hide it; otherwise a solid `bg-muted` cover hides the
  // real photo (even when the img is opacity-100 in DevTools). Mirror Radix
  // Avatar: fallback only for loading / no-image / error. Not a Next.js config
  // issue.
  if (state?.imageLoadSucceeded) {
    return null;
  }

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "text-muted-foreground absolute inset-0 z-0 inline-flex items-center justify-center bg-muted text-xs font-medium",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
