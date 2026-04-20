import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  showWordmark?: boolean;
  className?: string;
};

/**
 * Brand mark — a stylised "AIE" monogram with two neuron edges. Used in
 * the marketing header, the (app) top bar, and the auth/onboarding chrome.
 */
export function Logo({
  href = "/",
  showWordmark = true,
  className,
}: LogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark className="size-7" />
      {showWordmark ? (
        <span className="text-base">
          AI<span className="text-primary">Engineer</span>
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className="focus-visible:ring-ring rounded-md focus-visible:ring-2 focus-visible:outline-none"
    >
      {content}
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("text-primary", className)}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        fill="url(#logo-grad)"
        opacity="0.12"
      />
      <path
        d="M9 22 L13 10 L17 22 M10.5 18 H15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="11" r="1.5" fill="currentColor" />
      <circle cx="25" cy="20" r="1.5" fill="var(--accent)" />
      <path
        d="M22 11 L25 20"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
