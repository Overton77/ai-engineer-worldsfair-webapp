import { z } from "zod";

/**
 * Centralised, zod-validated environment access.
 *
 * Required keys throw at first import in any server context that reads
 * them. Optional integrations (PostHog, Sentry, GitHub OAuth) are
 * present-or-undefined: callers branch on `is*Configured()` so the app
 * boots without them and lights up automatically when keys are added.
 */

const PUBLIC_ENV_SCHEMA = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const SERVER_ENV_SCHEMA = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  POSTHOG_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  GITHUB_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
});

function readPublic() {
  return PUBLIC_ENV_SCHEMA.parse({
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
}

function readServer() {
  return SERVER_ENV_SCHEMA.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    GITHUB_OAUTH_CLIENT_ID: process.env.GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: process.env.GITHUB_OAUTH_CLIENT_SECRET,
  });
}

export const publicEnv = readPublic();
export const serverEnv = readServer();

export function getSiteUrl(): string {
  if (publicEnv.NEXT_PUBLIC_SITE_URL) return publicEnv.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const isPosthogConfigured = (): boolean =>
  Boolean(publicEnv.NEXT_PUBLIC_POSTHOG_KEY);

export const isSentryConfigured = (): boolean =>
  Boolean(publicEnv.NEXT_PUBLIC_SENTRY_DSN || serverEnv.SENTRY_DSN);

export const isGithubOauthConfigured = (): boolean =>
  Boolean(
    serverEnv.GITHUB_OAUTH_CLIENT_ID && serverEnv.GITHUB_OAUTH_CLIENT_SECRET,
  );
