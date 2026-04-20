/**
 * Analytics shim. While `NEXT_PUBLIC_POSTHOG_KEY` (or `POSTHOG_KEY`) is
 * not set, every call is a no-op so the codebase can already fire events
 * (onboarding step transitions, save / follow / module-complete, etc.)
 * without runtime errors.
 *
 * U9.1 will swap this for a real PostHog client + add `instrumentation.ts`
 * for Sentry — no caller will need to change.
 */

import { isPosthogConfigured } from "@/lib/env";

export type AnalyticsProps = Record<string, unknown> | undefined;

export function track(event: string, props?: AnalyticsProps): void {
  if (!isPosthogConfigured()) return;
  // Real PostHog wire-up lands in U9.1 once credentials are in place.
  // Until then we keep the shape so call sites can be authored now.
  void event;
  void props;
}

export function identify(userId: string, traits?: AnalyticsProps): void {
  if (!isPosthogConfigured()) return;
  void userId;
  void traits;
}

export function reset(): void {
  if (!isPosthogConfigured()) return;
}
