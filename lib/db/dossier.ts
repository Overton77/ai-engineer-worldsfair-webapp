/**
 * Dossier graph readers — one per entity-kind. Each reader fans out
 * parallel queries via Promise.all and returns a typed bundle the
 * dossier UI can render directly. Missing or unindexed relationships
 * degrade to empty arrays rather than throwing.
 *
 * Every read uses the SSR Supabase client so RLS scoping applies
 * (`*_public_read` for entity tables, owner-scoped for `notes`).
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { EntitySummary } from "@/types/domain";

import { toEntitySummary } from "./entity-summary";

type Client = SupabaseClient<Database>;

async function getClient(client?: Client): Promise<Client> {
  return client ?? ((await createServerSupabase()) as unknown as Client);
}

const RELATED_LIMIT = 24;

type PersonRow = Database["public"]["Tables"]["person"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organization"]["Row"];
type LibraryRow = Database["public"]["Tables"]["library"]["Row"];
type PaperRow = Database["public"]["Tables"]["paper"]["Row"];
type SessionRow = Database["public"]["Tables"]["session"]["Row"];
type YoutubeVideoRow = Database["public"]["Tables"]["youtube_video"]["Row"];
type EventRow = Database["public"]["Tables"]["event"]["Row"];
type RepoRow = Database["public"]["Tables"]["repo"]["Row"];
type ProductRow = Database["public"]["Tables"]["product"]["Row"];

// ─── helpers ─────────────────────────────────────────────────────────

async function tryArray<T>(
  fn: () => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`dossier read: ${error.message}`);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn(
      `dossier read threw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

async function trySingle<T>(
  fn: () => PromiseLike<{
    data: T | null;
    error: { message: string } | null;
  }>,
): Promise<T | null> {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`dossier read: ${error.message}`);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.warn(
      `dossier read threw: ${err instanceof Error ? err.message : String(err)}`,
    );
    return null;
  }
}

// ─── person dossier ──────────────────────────────────────────────────

export type PersonDossier = {
  person: PersonRow;
  employedAt: EntitySummary[];
  founded: EntitySummary[];
  talks: EntitySummary[];
  presentedSessions: EntitySummary[];
  authoredPapers: EntitySummary[];
  attendedEvents: EntitySummary[];
};

export async function getPersonDossier(
  slug: string,
  client?: Client,
): Promise<PersonDossier | null> {
  const sb = await getClient(client);
  const { data: person, error } = await sb
    .from("person")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getPersonDossier(${slug}): ${error.message}`);
  if (!person) return null;

  const personId = person.person_id;
  const [
    employed,
    founded,
    appeared,
    presented,
    authoredP,
    attended,
  ] = await Promise.all([
    tryArray<{ organization: OrganizationRow | null }>(() =>
      sb
        .from("person_employed_by")
        .select("organization:organization!inner(*)")
        .eq("person_id", personId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ organization: OrganizationRow | null }>(() =>
      sb
        .from("person_founded_organization")
        .select("organization:organization!inner(*)")
        .eq("person_id", personId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ video: YoutubeVideoRow | null }>(() =>
      sb
        .from("person_appeared_in_video")
        .select("video:youtube_video!inner(*)")
        .eq("person_id", personId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ session: SessionRow | null }>(() =>
      sb
        .from("person_presented_at_session")
        .select("session:session!inner(*)")
        .eq("person_id", personId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ paper: PaperRow | null }>(() =>
      sb
        .from("paper_authored_by")
        .select("paper:paper!inner(*)")
        .eq("person_id", personId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ event: EventRow | null }>(() =>
      sb
        .from("person_attended_event")
        .select("event:event!inner(*)")
        .eq("person_id", personId)
        .limit(RELATED_LIMIT),
    ),
  ]);

  return {
    person,
    employedAt: employed
      .map((r) => r.organization)
      .filter((o): o is OrganizationRow => Boolean(o))
      .map((o) => toEntitySummary("organization", o)),
    founded: founded
      .map((r) => r.organization)
      .filter((o): o is OrganizationRow => Boolean(o))
      .map((o) => toEntitySummary("organization", o)),
    talks: appeared
      .map((r) => r.video)
      .filter((v): v is YoutubeVideoRow => Boolean(v))
      .map((v) => toEntitySummary("youtube_video", v)),
    presentedSessions: presented
      .map((r) => r.session)
      .filter((s): s is SessionRow => Boolean(s))
      .map((s) => toEntitySummary("session", s)),
    authoredPapers: authoredP
      .map((r) => r.paper)
      .filter((p): p is PaperRow => Boolean(p))
      .map((p) => toEntitySummary("paper", p)),
    attendedEvents: attended
      .map((r) => r.event)
      .filter((e): e is EventRow => Boolean(e))
      .map((e) => toEntitySummary("event", e)),
  };
}

// ─── organization dossier ────────────────────────────────────────────

export type OrganizationDossier = {
  organization: OrganizationRow;
  ceo: EntitySummary | null;
  employees: EntitySummary[];
  founders: EntitySummary[];
  libraries: EntitySummary[];
  products: EntitySummary[];
  repos: EntitySummary[];
  sponsoredEvents: EntitySummary[];
};

export async function getOrganizationDossier(
  slug: string,
  client?: Client,
): Promise<OrganizationDossier | null> {
  const sb = await getClient(client);
  const { data: org, error } = await sb
    .from("organization")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error)
    throw new Error(`getOrganizationDossier(${slug}): ${error.message}`);
  if (!org) return null;

  const orgId = org.organization_id;
  const [ceoRows, employees, founders, libraries, products, repos, sponsored] =
    await Promise.all([
      tryArray<{ person: PersonRow | null }>(() =>
        sb
          .from("organization_has_ceo")
          .select("person:person!inner(*)")
          .eq("organization_id", orgId)
          .limit(1),
      ),
      tryArray<{ person: PersonRow | null }>(() =>
        sb
          .from("person_employed_by")
          .select("person:person!inner(*)")
          .eq("organization_id", orgId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ person: PersonRow | null }>(() =>
        sb
          .from("person_founded_organization")
          .select("person:person!inner(*)")
          .eq("organization_id", orgId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<LibraryRow>(() =>
        sb
          .from("library")
          .select("*")
          .eq("organization_id", orgId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<ProductRow>(() =>
        sb
          .from("product")
          .select("*")
          .eq("organization_id", orgId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<RepoRow>(() =>
        sb
          .from("repo")
          .select("*")
          .eq("organization_id", orgId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ event: EventRow | null }>(() =>
        sb
          .from("organization_sponsored_event")
          .select("event:event!inner(*)")
          .eq("organization_id", orgId)
          .limit(RELATED_LIMIT),
      ),
    ]);

  const ceoPerson = ceoRows[0]?.person ?? null;
  return {
    organization: org,
    ceo: ceoPerson ? toEntitySummary("person", ceoPerson) : null,
    employees: employees
      .map((r) => r.person)
      .filter((p): p is PersonRow => Boolean(p))
      .map((p) => toEntitySummary("person", p)),
    founders: founders
      .map((r) => r.person)
      .filter((p): p is PersonRow => Boolean(p))
      .map((p) => toEntitySummary("person", p)),
    libraries: libraries.map((l) => toEntitySummary("library", l)),
    products: products.map((p) => toEntitySummary("product", p)),
    repos: repos.map((r) =>
      toEntitySummary("repo", {
        slug: r.slug,
        name: `${r.github_org}/${r.github_repo}`,
        description: r.description,
        topics: r.topics,
      }),
    ),
    sponsoredEvents: sponsored
      .map((r) => r.event)
      .filter((e): e is EventRow => Boolean(e))
      .map((e) => toEntitySummary("event", e)),
  };
}

// ─── library dossier ─────────────────────────────────────────────────

export type LibraryDossier = {
  library: LibraryRow;
  organization: EntitySummary | null;
  repos: EntitySummary[];
  appearedInTalks: EntitySummary[];
  appearedInSessions: EntitySummary[];
  usesLibraries: EntitySummary[];
  usedByLibraries: EntitySummary[];
};

export async function getLibraryDossier(
  slug: string,
  client?: Client,
): Promise<LibraryDossier | null> {
  const sb = await getClient(client);
  const { data: lib, error } = await sb
    .from("library")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getLibraryDossier(${slug}): ${error.message}`);
  if (!lib) return null;

  const [orgRow, reposRows, videos, sessions, usesRows, usedByRows] =
    await Promise.all([
      lib.organization_id
        ? trySingle<OrganizationRow>(() =>
            sb
              .from("organization")
              .select("*")
              .eq("organization_id", lib.organization_id as string)
              .maybeSingle(),
          )
        : Promise.resolve<OrganizationRow | null>(null),
      tryArray<RepoRow>(() =>
        sb
          .from("repo")
          .select("*")
          .eq("library_slug", slug)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ video: YoutubeVideoRow | null }>(() =>
        sb
          .from("library_appeared_in_video")
          .select("video:youtube_video!inner(*)")
          .eq("library_slug", slug)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ session: SessionRow | null }>(() =>
        sb
          .from("library_appeared_in_session")
          .select("session:session!inner(*)")
          .eq("library_slug", slug)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ child: LibraryRow | null }>(() =>
        sb
          .from("library_uses_library")
          .select("child:library!library_uses_library_child_library_slug_fkey(*)")
          .eq("parent_library_slug", slug)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ parent: LibraryRow | null }>(() =>
        sb
          .from("library_uses_library")
          .select("parent:library!library_uses_library_parent_library_slug_fkey(*)")
          .eq("child_library_slug", slug)
          .limit(RELATED_LIMIT),
      ),
    ]);

  return {
    library: lib,
    organization: orgRow ? toEntitySummary("organization", orgRow) : null,
    repos: reposRows.map((r) =>
      toEntitySummary("repo", {
        slug: r.slug,
        name: `${r.github_org}/${r.github_repo}`,
        description: r.description,
        topics: r.topics,
      }),
    ),
    appearedInTalks: videos
      .map((r) => r.video)
      .filter((v): v is YoutubeVideoRow => Boolean(v))
      .map((v) => toEntitySummary("youtube_video", v)),
    appearedInSessions: sessions
      .map((r) => r.session)
      .filter((s): s is SessionRow => Boolean(s))
      .map((s) => toEntitySummary("session", s)),
    usesLibraries: usesRows
      .map((r) => r.child)
      .filter((l): l is LibraryRow => Boolean(l))
      .map((l) => toEntitySummary("library", l)),
    usedByLibraries: usedByRows
      .map((r) => r.parent)
      .filter((l): l is LibraryRow => Boolean(l))
      .map((l) => toEntitySummary("library", l)),
  };
}

// ─── paper dossier ───────────────────────────────────────────────────

export type PaperDossier = {
  paper: PaperRow;
  authors: EntitySummary[];
  appearedInTalks: EntitySummary[];
};

export async function getPaperDossier(
  slug: string,
  client?: Client,
): Promise<PaperDossier | null> {
  const sb = await getClient(client);
  const { data: paper, error } = await sb
    .from("paper")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getPaperDossier(${slug}): ${error.message}`);
  if (!paper) return null;

  const [authors, videos] = await Promise.all([
    tryArray<{ person: PersonRow | null }>(() =>
      sb
        .from("paper_authored_by")
        .select("person:person!inner(*)")
        .eq("paper_slug", slug)
        .order("ord", { ascending: true })
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ video: YoutubeVideoRow | null }>(() =>
      sb
        .from("paper_appeared_in_video")
        .select("video:youtube_video!inner(*)")
        .eq("paper_slug", slug)
        .limit(RELATED_LIMIT),
    ),
  ]);

  return {
    paper,
    authors: authors
      .map((r) => r.person)
      .filter((p): p is PersonRow => Boolean(p))
      .map((p) => toEntitySummary("person", p)),
    appearedInTalks: videos
      .map((r) => r.video)
      .filter((v): v is YoutubeVideoRow => Boolean(v))
      .map((v) => toEntitySummary("youtube_video", v)),
  };
}

// ─── session (talk) dossier ──────────────────────────────────────────

export type SessionDossier = {
  session: SessionRow;
  event: EntitySummary | null;
  video: EntitySummary | null;
  speakers: EntitySummary[];
  libraries: EntitySummary[];
};

export async function getSessionDossier(
  slug: string,
  client?: Client,
): Promise<SessionDossier | null> {
  const sb = await getClient(client);
  const { data: session, error } = await sb
    .from("session")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getSessionDossier(${slug}): ${error.message}`);
  if (!session) return null;

  const sessionId = session.session_id;
  const [videoLink, speakers, libraries, eventRow] = await Promise.all([
    tryArray<{ video: YoutubeVideoRow | null }>(() =>
      sb
        .from("session_recorded_as_video")
        .select("video:youtube_video!inner(*)")
        .eq("session_id", sessionId)
        .limit(1),
    ),
    tryArray<{ person: PersonRow | null }>(() =>
      sb
        .from("person_presented_at_session")
        .select("person:person!inner(*)")
        .eq("session_id", sessionId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ library: LibraryRow | null }>(() =>
      sb
        .from("library_appeared_in_session")
        .select("library:library!inner(*)")
        .eq("session_id", sessionId)
        .limit(RELATED_LIMIT),
    ),
    session.event_id
      ? trySingle<EventRow>(() =>
          sb
            .from("event")
            .select("*")
            .eq("event_id", session.event_id as string)
            .maybeSingle(),
        )
      : Promise.resolve<EventRow | null>(null),
  ]);

  const linkedVideo = videoLink[0]?.video ?? null;
  return {
    session,
    event: eventRow ? toEntitySummary("event", eventRow) : null,
    video: linkedVideo ? toEntitySummary("youtube_video", linkedVideo) : null,
    speakers: speakers
      .map((r) => r.person)
      .filter((p): p is PersonRow => Boolean(p))
      .map((p) => toEntitySummary("person", p)),
    libraries: libraries
      .map((r) => r.library)
      .filter((l): l is LibraryRow => Boolean(l))
      .map((l) => toEntitySummary("library", l)),
  };
}

// ─── youtube video dossier ───────────────────────────────────────────

export type VideoChapter = {
  start_seconds: number;
  end_seconds: number | null;
  title: string;
};

export type VideoDossier = {
  video: YoutubeVideoRow;
  channelTitle: string | null;
  speakers: EntitySummary[];
  libraries: EntitySummary[];
  papers: EntitySummary[];
  products: EntitySummary[];
  session: EntitySummary | null;
  event: EntitySummary | null;
  chapters: VideoChapter[];
};

function parseChapters(raw: unknown): VideoChapter[] {
  if (!Array.isArray(raw)) return [];
  const out: VideoChapter[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const start =
      typeof r.start_seconds === "number"
        ? r.start_seconds
        : typeof r.start === "number"
          ? r.start
          : typeof r.t === "number"
            ? r.t
            : null;
    const title =
      typeof r.title === "string"
        ? r.title
        : typeof r.label === "string"
          ? r.label
          : null;
    if (start === null || title === null) continue;
    const end =
      typeof r.end_seconds === "number"
        ? r.end_seconds
        : typeof r.end === "number"
          ? r.end
          : null;
    out.push({ start_seconds: start, end_seconds: end, title });
  }
  return out.sort((a, b) => a.start_seconds - b.start_seconds);
}

export async function getVideoDossier(
  videoId: string,
  client?: Client,
): Promise<VideoDossier | null> {
  const sb = await getClient(client);
  const { data: video, error } = await sb
    .from("youtube_video")
    .select("*")
    .eq("video_id", videoId)
    .maybeSingle();
  if (error) throw new Error(`getVideoDossier(${videoId}): ${error.message}`);
  if (!video) return null;

  const [channelRow, speakers, libraries, papers, products, sessionLink, eventRow] =
    await Promise.all([
      video.channel_id
        ? trySingle<{ channel_title: string | null }>(() =>
            sb
              .from("youtube_channel")
              .select("channel_title")
              .eq("channel_id", video.channel_id as string)
              .maybeSingle(),
          ).then((r) => r?.channel_title ?? null)
        : Promise.resolve<string | null>(null),
      tryArray<{ person: PersonRow | null }>(() =>
        sb
          .from("person_appeared_in_video")
          .select("person:person!inner(*)")
          .eq("video_id", videoId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ library: LibraryRow | null }>(() =>
        sb
          .from("library_appeared_in_video")
          .select("library:library!inner(*)")
          .eq("video_id", videoId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ paper: PaperRow | null }>(() =>
        sb
          .from("paper_appeared_in_video")
          .select("paper:paper!inner(*)")
          .eq("video_id", videoId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ product: ProductRow | null }>(() =>
        sb
          .from("product_appeared_in_video")
          .select("product:product!inner(*)")
          .eq("video_id", videoId)
          .limit(RELATED_LIMIT),
      ),
      tryArray<{ session: SessionRow | null }>(() =>
        sb
          .from("session_recorded_as_video")
          .select("session:session!inner(*)")
          .eq("video_id", videoId)
          .limit(1),
      ),
      video.event_id
        ? trySingle<EventRow>(() =>
            sb
              .from("event")
              .select("*")
              .eq("event_id", video.event_id as string)
              .maybeSingle(),
          )
        : Promise.resolve<EventRow | null>(null),
    ]);

  const linkedSession = sessionLink[0]?.session ?? null;
  return {
    video,
    channelTitle: channelRow,
    speakers: speakers
      .map((r) => r.person)
      .filter((p): p is PersonRow => Boolean(p))
      .map((p) => toEntitySummary("person", p)),
    libraries: libraries
      .map((r) => r.library)
      .filter((l): l is LibraryRow => Boolean(l))
      .map((l) => toEntitySummary("library", l)),
    papers: papers
      .map((r) => r.paper)
      .filter((p): p is PaperRow => Boolean(p))
      .map((p) => toEntitySummary("paper", p)),
    products: products
      .map((r) => r.product)
      .filter((p): p is ProductRow => Boolean(p))
      .map((p) => toEntitySummary("product", p)),
    session: linkedSession ? toEntitySummary("session", linkedSession) : null,
    event: eventRow ? toEntitySummary("event", eventRow) : null,
    chapters: parseChapters(video.chapters),
  };
}

// ─── event dossier ───────────────────────────────────────────────────

export type EventDossier = {
  event: EventRow;
  sessions: EntitySummary[];
  sponsors: EntitySummary[];
  attendees: EntitySummary[];
};

export async function getEventDossier(
  slug: string,
  client?: Client,
): Promise<EventDossier | null> {
  const sb = await getClient(client);
  const { data: event, error } = await sb
    .from("event")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getEventDossier(${slug}): ${error.message}`);
  if (!event) return null;

  const eventId = event.event_id;
  const [sessions, sponsors, attendees] = await Promise.all([
    tryArray<SessionRow>(() =>
      sb
        .from("session")
        .select("*")
        .eq("event_id", eventId)
        .order("scheduled_at", { ascending: true })
        .limit(100),
    ),
    tryArray<{ organization: OrganizationRow | null }>(() =>
      sb
        .from("organization_sponsored_event")
        .select("organization:organization!inner(*)")
        .eq("event_id", eventId)
        .limit(RELATED_LIMIT),
    ),
    tryArray<{ person: PersonRow | null }>(() =>
      sb
        .from("person_attended_event")
        .select("person:person!inner(*)")
        .eq("event_id", eventId)
        .limit(RELATED_LIMIT),
    ),
  ]);

  return {
    event,
    sessions: sessions.map((s) => toEntitySummary("session", s)),
    sponsors: sponsors
      .map((r) => r.organization)
      .filter((o): o is OrganizationRow => Boolean(o))
      .map((o) => toEntitySummary("organization", o)),
    attendees: attendees
      .map((r) => r.person)
      .filter((p): p is PersonRow => Boolean(p))
      .map((p) => toEntitySummary("person", p)),
  };
}
