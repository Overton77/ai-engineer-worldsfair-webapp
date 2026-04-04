"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  OrganizationCard,
  PersonCard,
  SessionCard,
  VideoCard,
} from "@/components/entity-cards";
import { YoutubeEmbed } from "@/components/youtube-embed";
import type { Tables } from "@/types/database.types";

type Tab = "videos" | "persons" | "organizations" | "sessions";

type PersonRow = Tables<"person"> & {
  person_employed_by?: Array<{
    role_title: string | null;
    organization?: Tables<"organization"> | null;
  }>;
  person_founded_organization?: Array<{
    role_title: string | null;
    organization?: Tables<"organization"> | null;
  }>;
  organization_has_ceo?: Array<{
    role_title: string | null;
    organization?: Tables<"organization"> | null;
  }>;
  person_presented_at_session?: Array<{
    session?: Tables<"session"> | null;
  }>;
  person_appeared_in_video?: Array<{
    matched_name_variant?: string | null;
    match_method?: string | null;
    youtube_video?: Tables<"youtube_video"> | null;
  }>;
};

type OrgRow = Tables<"organization"> & {
  person_employed_by?: Array<{
    role_title: string | null;
    person?: Tables<"person"> | null;
  }>;
  person_founded_organization?: Array<{
    role_title: string | null;
    person?: Tables<"person"> | null;
  }>;
  organization_has_ceo?: Array<{
    role_title: string | null;
    person?: Tables<"person"> | null;
  }>;
};

type SessionRow = Tables<"session"> & {
  person_presented_at_session?: Array<{ person?: Tables<"person"> | null }>;
  session_recorded_as_video?:
    | Array<{
        match_similarity: number | null;
        youtube_video?: Tables<"youtube_video"> | null;
      }>
    | {
        match_similarity: number | null;
        youtube_video?: Tables<"youtube_video"> | null;
      }
    | null;
};

type VideoRow = Tables<"youtube_video"> & {
  youtube_channel?: Tables<"youtube_channel"> | null;
  session_recorded_as_video?:
    | Array<{
        match_similarity: number | null;
        session?: Tables<"session"> | null;
      }>
    | {
        match_similarity: number | null;
        session?: Tables<"session"> | null;
      }
    | null;
  person_appeared_in_video?: Array<{
    matched_name_variant?: string | null;
    match_method?: string | null;
    person?: Tables<"person"> | null;
  }>;
};

function tabLabel(t: Tab): string {
  switch (t) {
    case "videos":
      return "YouTube";
    case "persons":
      return "People";
    case "organizations":
      return "Organizations";
    case "sessions":
      return "Sessions";
    default:
      return t;
  }
}

function normalizeSessionVideoLink(
  raw: SessionRow["session_recorded_as_video"],
): { match_similarity: number | null; youtube_video?: Tables<"youtube_video"> | null }[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function normalizeVideoSessionLink(
  raw: VideoRow["session_recorded_as_video"],
): { match_similarity: number | null; session?: Tables<"session"> | null }[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function DirectoryExplorer() {
  const [tab, setTab] = useState<Tab>("videos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);

  const [selPerson, setSelPerson] = useState<PersonRow | null>(null);
  const [selOrg, setSelOrg] = useState<OrgRow | null>(null);
  const [selSession, setSelSession] = useState<SessionRow | null>(null);
  const [selVideo, setSelVideo] = useState<VideoRow | null>(null);

  /** When browsing a person/session, optional video to play in the player. */
  const [playerVideo, setPlayerVideo] = useState<VideoRow | Tables<"youtube_video"> | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const expand = "1";
      const limit = "60";
      const base = { expand, limit };

      const q = new URLSearchParams(base as Record<string, string>);
      const [pr, or, se, vi] = await Promise.all([
        fetch(`/api/persons?${q}`),
        fetch(`/api/organizations?${q}`),
        fetch(`/api/sessions?${q}`),
        fetch(`/api/youtube-videos?${q}`),
      ]);

      for (const r of [pr, or, se, vi]) {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(
            typeof body?.error === "string" ? body.error : `${r.status} ${r.statusText}`,
          );
        }
      }

      const [pj, oj, sj, vj] = await Promise.all([
        pr.json() as Promise<{ data: PersonRow[] }>,
        or.json() as Promise<{ data: OrgRow[] }>,
        se.json() as Promise<{ data: SessionRow[] }>,
        vi.json() as Promise<{ data: VideoRow[] }>,
      ]);

      setPersons(pj.data ?? []);
      setOrgs(oj.data ?? []);
      setSessions(sj.data ?? []);
      setVideos(vj.data ?? []);

      setSelPerson(pj.data?.[0] ?? null);
      setSelOrg(oj.data?.[0] ?? null);
      setSelSession(sj.data?.[0] ?? null);
      const firstVid = vj.data?.[0] ?? null;
      setSelVideo(firstVid);
      setPlayerVideo(firstVid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === "videos" && selVideo) {
      setPlayerVideo(selVideo);
    }
  }, [tab, selVideo]);

  const tabs = useMemo(
    () =>
      (["videos", "persons", "organizations", "sessions"] as const).map((t) => ({
        id: t,
        label: tabLabel(t),
      })),
    [],
  );

  const detailTitle = useMemo(() => {
    switch (tab) {
      case "persons":
        return selPerson?.full_name ?? selPerson?.person_id ?? "Select someone";
      case "organizations":
        return selOrg?.name ?? selOrg?.organization_id ?? "Select an organization";
      case "sessions":
        return selSession?.title ?? selSession?.session_id ?? "Select a session";
      case "videos":
      default:
        return selVideo?.title ?? selVideo?.video_id ?? "Select a video";
    }
  }, [tab, selPerson, selOrg, selSession, selVideo]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-amber-700 dark:text-amber-400">
          AI Engineer — Worlds Fair &amp; channel
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
          People, orgs, talks, and watchable recordings
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Data comes from your Supabase API routes. Pick a category, explore the list, and play YouTube
          embeds from the detail panel.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Directory sections"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="ml-auto rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <aside
          className="max-h-[70vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-12rem)]"
          aria-label="List"
        >
          {tab === "persons" &&
            persons.map((p) => (
              <PersonCard
                key={p.person_id}
                person={p}
                active={selPerson?.person_id === p.person_id}
                onSelect={() => {
                  setSelPerson(p);
                  setPlayerVideo(null);
                }}
              />
            ))}
          {tab === "organizations" &&
            orgs.map((o) => (
              <OrganizationCard
                key={o.organization_id}
                org={o}
                active={selOrg?.organization_id === o.organization_id}
                onSelect={() => {
                  setSelOrg(o);
                  setPlayerVideo(null);
                }}
              />
            ))}
          {tab === "sessions" &&
            sessions.map((s) => (
              <SessionCard
                key={s.session_id}
                session={s}
                active={selSession?.session_id === s.session_id}
                onSelect={() => {
                  setSelSession(s);
                  const links = normalizeSessionVideoLink(s.session_recorded_as_video);
                  const v = links[0]?.youtube_video;
                  setPlayerVideo(v ? { ...v, youtube_channel: null } : null);
                }}
              />
            ))}
          {tab === "videos" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {videos.map((v) => (
                <VideoCard
                  key={v.video_id}
                  video={v}
                  active={selVideo?.video_id === v.video_id}
                  onSelect={() => {
                    setSelVideo(v);
                    setPlayerVideo(v);
                  }}
                />
              ))}
            </div>
          )}
        </aside>

        <section className="space-y-6 lg:sticky lg:top-6" aria-live="polite">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{detailTitle}</h2>

          {playerVideo ? (
            <YoutubeEmbed
              videoId={playerVideo.video_id}
              url={playerVideo.url}
              title={playerVideo.title}
            />
          ) : tab === "videos" ? (
            <p className="text-sm text-zinc-500">Choose a video from the list to play it here.</p>
          ) : (
            <p className="text-sm text-zinc-500">
              Select a session linked to a recording, or switch to <strong>YouTube</strong> to pick a
              video. For people, use{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">Watch</strong> on an appearance
              below.
            </p>
          )}

          {tab === "persons" && selPerson ? (
            <PersonDetail
              person={selPerson}
              onPlayVideo={(v) => setPlayerVideo(v)}
            />
          ) : null}
          {tab === "organizations" && selOrg ? <OrgDetail org={selOrg} /> : null}
          {tab === "sessions" && selSession ? (
            <SessionDetail
              session={selSession}
              onPlayVideo={(v) => setPlayerVideo(v)}
            />
          ) : null}
          {tab === "videos" && selVideo ? <VideoDetail video={selVideo} /> : null}
        </section>
      </div>
    </div>
  );
}

function PersonDetail({
  person,
  onPlayVideo,
}: {
  person: PersonRow;
  onPlayVideo: (v: Tables<"youtube_video">) => void;
}) {
  return (
    <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
      {person.tag_line ? <p className="text-zinc-600 dark:text-zinc-400">{person.tag_line}</p> : null}
      {person.bio ? (
        <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{person.bio}</p>
      ) : null}
      <div className="flex flex-wrap gap-3 text-xs">
        {person.linkedin_url ? (
          <a className="text-amber-700 underline dark:text-amber-300" href={person.linkedin_url} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        ) : null}
        {person.ai_engineer_url ? (
          <a
            className="text-amber-700 underline dark:text-amber-300"
            href={person.ai_engineer_url}
            target="_blank"
            rel="noreferrer"
          >
            AI Engineer profile
          </a>
        ) : null}
      </div>

      {person.person_employed_by?.length ? (
        <DetailBlock title="Employed by">
          <ul className="mt-1 list-inside list-disc space-y-1">
            {person.person_employed_by.map((row, i) => (
              <li key={i}>
                {row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                {row.role_title ? ` — ${row.role_title}` : ""}
              </li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}

      {person.person_presented_at_session?.length ? (
        <DetailBlock title="Sessions">
          <ul className="mt-1 list-inside list-disc space-y-1">
            {person.person_presented_at_session.map((row, i) => (
              <li key={i}>{row.session?.title ?? row.session?.session_id ?? "Session"}</li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}

      {person.person_appeared_in_video?.length ? (
        <DetailBlock title="Appearances on YouTube">
          <ul className="mt-2 space-y-2">
            {person.person_appeared_in_video.map((row, i) => {
              const v = row.youtube_video;
              if (!v) return null;
              return (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="line-clamp-1 min-w-0 flex-1">
                    {v.title ?? v.video_id}
                    {row.matched_name_variant ? (
                      <span className="text-zinc-500"> ({row.matched_name_variant})</span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPlayVideo(v)}
                    className="shrink-0 rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
                  >
                    Watch
                  </button>
                </li>
              );
            })}
          </ul>
        </DetailBlock>
      ) : null}
    </div>
  );
}

function OrgDetail({ org }: { org: OrgRow }) {
  return (
    <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
      {org.overview ? (
        <p className="whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{org.overview}</p>
      ) : null}
      {org.primary_ai_focus ? (
        <p>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Focus: </span>
          {org.primary_ai_focus}
        </p>
      ) : null}

      {org.organization_has_ceo?.[0]?.person ? (
        <DetailBlock title="CEO">
          <p>{org.organization_has_ceo[0].person?.full_name ?? org.organization_has_ceo[0].person?.person_id}</p>
        </DetailBlock>
      ) : null}

      {org.person_founded_organization?.length ? (
        <DetailBlock title="Founders">
          <ul className="mt-1 list-inside list-disc space-y-1">
            {org.person_founded_organization.map((row, i) => (
              <li key={i}>{row.person?.full_name ?? row.person?.person_id}</li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}

      {org.person_employed_by?.length ? (
        <DetailBlock title="People (employed)">
          <ul className="mt-1 list-inside list-disc space-y-1">
            {org.person_employed_by.slice(0, 40).map((row, i) => (
              <li key={i}>
                {row.person?.full_name ?? row.person?.person_id}
                {row.role_title ? ` — ${row.role_title}` : ""}
              </li>
            ))}
            {org.person_employed_by.length > 40 ? (
              <li className="list-none text-zinc-500">…and more</li>
            ) : null}
          </ul>
        </DetailBlock>
      ) : null}
    </div>
  );
}

function SessionDetail({
  session,
  onPlayVideo,
}: {
  session: SessionRow;
  onPlayVideo: (v: Tables<"youtube_video">) => void;
}) {
  const links = normalizeSessionVideoLink(session.session_recorded_as_video);
  const video = links[0]?.youtube_video;

  return (
    <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
      {session.description ? (
        <p className="leading-relaxed text-zinc-800 dark:text-zinc-200">{session.description}</p>
      ) : null}
      {session.extended_description ? (
        <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Extended description
          </summary>
          <div className="border-t border-zinc-200 px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
            {session.extended_description}
          </div>
        </details>
      ) : null}

      {session.person_presented_at_session?.length ? (
        <DetailBlock title="Presenters">
          <ul className="mt-1 list-inside list-disc space-y-1">
            {session.person_presented_at_session.map((row, i) => (
              <li key={i}>{row.person?.full_name ?? row.person?.person_id}</li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}

      {video ? (
        <DetailBlock title="Recording">
          <p className="mt-1 line-clamp-2 text-zinc-800 dark:text-zinc-200">{video.title ?? video.video_id}</p>
          <button
            type="button"
            onClick={() => onPlayVideo(video)}
            className="mt-3 rounded-full bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-500"
          >
            Play recording
          </button>
        </DetailBlock>
      ) : (
        <p className="text-zinc-500">No linked YouTube recording for this session.</p>
      )}
    </div>
  );
}

function VideoDetail({ video }: { video: VideoRow }) {
  const sessLinks = normalizeVideoSessionLink(video.session_recorded_as_video);

  return (
    <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
      {video.description ? (
        <p className="line-clamp-6 whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200 md:line-clamp-none">
          {video.description}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        {video.view_count != null ? <span>Views: {Number(video.view_count).toLocaleString()}</span> : null}
        {video.like_count != null ? <span>Likes: {Number(video.like_count).toLocaleString()}</span> : null}
        {video.duration ? <span>Duration: {video.duration}</span> : null}
      </div>
      {video.url ? (
        <a
          className="inline-flex text-xs font-medium text-amber-700 underline dark:text-amber-300"
          href={video.url}
          target="_blank"
          rel="noreferrer"
        >
          Open on YouTube
        </a>
      ) : null}

      {sessLinks[0]?.session ? (
        <DetailBlock title="Matched session">
          <p>{sessLinks[0].session?.title ?? sessLinks[0].session?.session_id}</p>
          {sessLinks[0].match_similarity != null ? (
            <p className="text-xs text-zinc-500">Similarity: {sessLinks[0].match_similarity.toFixed(3)}</p>
          ) : null}
        </DetailBlock>
      ) : null}

      {video.person_appeared_in_video?.length ? (
        <DetailBlock title="People in this video">
          <ul className="mt-1 list-inside list-disc space-y-1">
            {video.person_appeared_in_video.map((row, i) => (
              <li key={i}>{row.person?.full_name ?? row.person?.person_id}</li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      {children}
    </div>
  );
}
