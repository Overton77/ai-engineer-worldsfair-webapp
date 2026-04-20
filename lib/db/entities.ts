/**
 * Per-domain typed query helpers. Only `profile` and `stats` ship live
 * in M0 — these helpers are thin scaffolding so M2/M5/M7 milestones can
 * wire them up without inventing query paths. Each one is acceptance-
 * level "imports cleanly, returns EntitySummary[]" today; richer
 * filtering / sorting lands in U3.x and U7.x.
 *
 * Each helper takes an injectable `client` so the same code runs in
 * Server Components (default `createServerSupabase`), in scripts
 * (service-role client), and in tests (mocked client).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { EntitySummary } from "@/types/domain";

import { toEntitySummary } from "./entity-summary";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? ((await createServerSupabase()) as unknown as Client);
}

const DEFAULT_LIMIT = 24;

// ── people ───────────────────────────────────────────────────────────
export async function listPeople(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("person")
    .select(
      "person_id, slug, full_name, role_title, tag_line, expertise_tags, sessionize_profile_picture_url",
    )
    .order("full_name", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listPeople: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("person", row));
}

export async function getPersonBySlug(
  slug: string,
  client?: Client,
): Promise<EntitySummary | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("person")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getPersonBySlug: ${error.message}`);
  return data ? toEntitySummary("person", data) : null;
}

// ── organizations ────────────────────────────────────────────────────
export async function listOrganizations(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("organization")
    .select("organization_id, slug, name, overview, logo_url, tags")
    .order("name", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listOrganizations: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("organization", row));
}

export async function getOrganizationBySlug(
  slug: string,
  client?: Client,
): Promise<EntitySummary | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("organization")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getOrganizationBySlug: ${error.message}`);
  return data ? toEntitySummary("organization", data) : null;
}

// ── libraries ────────────────────────────────────────────────────────
export async function listLibraries(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("library")
    .select("slug, name, tagline, description, tags, domain_layer, category")
    .order("name", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listLibraries: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("library", row));
}

export async function getLibraryBySlug(
  slug: string,
  client?: Client,
): Promise<EntitySummary | null> {
  const sb = await getClient(client);
  const { data, error } = await sb
    .from("library")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getLibraryBySlug: ${error.message}`);
  return data ? toEntitySummary("library", data) : null;
}

// ── papers ───────────────────────────────────────────────────────────
export async function listPapers(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("paper")
    .select("slug, title, abstract, tags, domain_layer")
    .order("title", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listPapers: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("paper", row));
}

// ── sessions / talks ─────────────────────────────────────────────────
export async function listSessions(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("session")
    .select("session_id, slug, title, description, tags, domain_layer")
    .order("title", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listSessions: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("session", row));
}

// ── videos ───────────────────────────────────────────────────────────
export async function listYoutubeVideos(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("youtube_video")
    .select(
      "video_id, slug, title, description, thumbnail_url, category, domain_layer, tags",
    )
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listYoutubeVideos: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("youtube_video", row));
}

// ── events ───────────────────────────────────────────────────────────
export async function listEvents(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("event")
    .select("event_id, slug, name, tagline, description, topic_tags")
    .order("start_date", { ascending: false })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listEvents: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("event", row));
}

// ── news ─────────────────────────────────────────────────────────────
export async function listNews(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("news_item")
    .select(
      "news_item_id, slug, title, headline, hero_image_url, summary, tags, domain_layer",
    )
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listNews: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("news_item", row));
}

// ── courses ──────────────────────────────────────────────────────────
export async function listCourses(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("course")
    .select("course_id, slug, title, summary, domain_layer")
    .eq("status", "published")
    .order("title", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listCourses: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("course", row));
}

// ── challenges ───────────────────────────────────────────────────────
export async function listChallenges(opts: {
  limit?: number;
  client?: Client;
} = {}): Promise<EntitySummary[]> {
  const sb = await getClient(opts.client);
  const { data, error } = await sb
    .from("challenge")
    .select("challenge_id, slug, title, runtime, est_minutes")
    .eq("status", "published")
    .order("title", { ascending: true })
    .limit(opts.limit ?? DEFAULT_LIMIT);
  if (error) throw new Error(`listChallenges: ${error.message}`);
  return (data ?? []).map((row) => toEntitySummary("challenge", row));
}
