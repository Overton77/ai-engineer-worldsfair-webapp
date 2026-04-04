"use client";

import {
  Clapperboard,
  Landmark,
  LayoutGrid,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  OrganizationCard,
  PersonCard,
  SessionCard,
  VideoCard,
} from "@/components/entity-cards";
import { RelationshipEdgeCard, RelationshipSection } from "@/components/relationship-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Tab = "videos" | "persons" | "organizations" | "sessions";

type PersonRow = Tables<"person"> & {
  person_employed_by?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    organization?: Tables<"organization"> | null;
  }>;
  person_founded_organization?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    organization?: Tables<"organization"> | null;
  }>;
  organization_has_ceo?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
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
    confidence?: number | null;
    needs_review?: boolean | null;
    person?: Tables<"person"> | null;
  }>;
  person_founded_organization?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    person?: Tables<"person"> | null;
  }>;
  organization_has_ceo?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
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

type SearchPreview = {
  persons: Array<Pick<Tables<"person">, "person_id" | "full_name" | "role_title">>;
  organizations: Array<
    Pick<Tables<"organization">, "organization_id" | "name" | "organization_type">
  >;
  youtube_videos: Array<
    Pick<Tables<"youtube_video">, "video_id" | "title" | "thumbnail_url"> & {
      youtube_channel?: { channel_title: string | null } | null;
    }
  >;
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

function tabIcon(t: Tab) {
  switch (t) {
    case "videos":
      return Clapperboard;
    case "persons":
      return UserRound;
    case "organizations":
      return Landmark;
    case "sessions":
      return Presentation;
    default:
      return LayoutGrid;
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
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);

  const [selPerson, setSelPerson] = useState<PersonRow | null>(null);
  const [selOrg, setSelOrg] = useState<OrgRow | null>(null);
  const [selSession, setSelSession] = useState<SessionRow | null>(null);
  const [selVideo, setSelVideo] = useState<VideoRow | null>(null);

  const [playerVideo, setPlayerVideo] = useState<VideoRow | Tables<"youtube_video"> | null>(null);
  const [searchPreview, setSearchPreview] = useState<SearchPreview | null>(null);
  const [searchPanelDismissed, setSearchPanelDismissed] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async (q: string) => {
    setError(null);
    setLoading(true);
    try {
      const expand = "1";
      const limit = "80";
      const base: Record<string, string> = { expand, limit };
      if (q) base.q = q;

      const qs = new URLSearchParams(base);
      const [pr, or, se, vi] = await Promise.all([
        fetch(`/api/persons?${qs}`),
        fetch(`/api/organizations?${qs}`),
        fetch(`/api/sessions?${qs}`),
        fetch(`/api/youtube-videos?${qs}`),
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

      const pData = pj.data ?? [];
      const oData = oj.data ?? [];
      const sData = sj.data ?? [];
      const vData = vj.data ?? [];

      setPersons(pData);
      setOrgs(oData);
      setSessions(sData);
      setVideos(vData);

      setSelPerson((prev) => pickOrFirst(pData, prev, (r) => r.person_id));
      setSelOrg((prev) => pickOrFirst(oData, prev, (r) => r.organization_id));
      setSelSession((prev) => pickOrFirst(sData, prev, (r) => r.session_id));
      setSelVideo((prev) => pickOrFirst(vData, prev, (r) => r.video_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(debouncedQ);
  }, [load, debouncedQ]);

  useEffect(() => {
    if (tab === "videos" && selVideo) {
      setPlayerVideo(selVideo);
    }
  }, [tab, selVideo]);

  useEffect(() => {
    if (debouncedQ.length < 2) {
      setSearchPreview(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}&limit=8`);
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as SearchPreview;
        if (!cancelled) setSearchPreview(j);
      } catch {
        if (!cancelled) setSearchPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  useEffect(() => {
    setSearchPanelDismissed(false);
  }, [debouncedQ]);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const el = searchAreaRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setSearchPanelDismissed(true);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const navItems = useMemo(
    () => (["videos", "persons", "organizations", "sessions"] as const).map((id) => ({ id, label: tabLabel(id), Icon: tabIcon(id) })),
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
    <div className="flex min-h-dvh w-full bg-background">
      <aside className="flex w-[min(100%,280px)] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2 text-sidebar-foreground">
            <Sparkles className="size-5 text-sidebar-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold leading-tight">AI Engineer</p>
              <p className="text-[11px] text-muted-foreground">Directory</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div ref={searchAreaRef} className="relative space-y-2">
            <Search className="pointer-events-none absolute left-2.5 top-[13px] z-10 size-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setSearchPanelDismissed(false)}
              placeholder="Search people, orgs, videos…"
              className="h-9 pl-8 text-xs"
              aria-label="Search directory"
              aria-expanded={
                !!(
                  searchPreview &&
                  debouncedQ.length >= 2 &&
                  !searchPanelDismissed &&
                  (searchPreview.persons.length > 0 ||
                    searchPreview.organizations.length > 0 ||
                    searchPreview.youtube_videos.length > 0)
                )
              }
            />
          {searchPreview &&
          debouncedQ.length >= 2 &&
          !searchPanelDismissed &&
          (searchPreview.persons.length > 0 ||
            searchPreview.organizations.length > 0 ||
            searchPreview.youtube_videos.length > 0) ? (
            <Card className="gap-0 py-0 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 py-2 pb-1">
                <div className="min-w-0">
                  <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Quick results
                  </CardTitle>
                  <CardDescription className="text-[10px]">Open a row in the list</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Close search results"
                  onClick={() => setSearchPanelDismissed(true)}
                >
                  <X className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 pb-2 pt-0">
                {searchPreview.persons.slice(0, 4).map((p) => (
                  <button
                    key={p.person_id}
                    type="button"
                    className="block w-full truncate rounded-md px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      void (async () => {
                        setSearchPanelDismissed(true);
                        setTab("persons");
                        const row = persons.find((x) => x.person_id === p.person_id);
                        if (row) {
                          setSelPerson(row);
                          return;
                        }
                        const r = await fetch(
                          `/api/persons/${encodeURIComponent(p.person_id)}?expand=1`,
                        );
                        if (!r.ok) return;
                        const j = (await r.json()) as { data: PersonRow };
                        if (j.data) setSelPerson(j.data);
                      })();
                    }}
                  >
                    <span className="font-medium">{p.full_name ?? p.person_id}</span>
                    {p.role_title ? (
                      <span className="text-muted-foreground"> — {p.role_title}</span>
                    ) : null}
                  </button>
                ))}
                {searchPreview.organizations.slice(0, 4).map((o) => (
                  <button
                    key={o.organization_id}
                    type="button"
                    className="block w-full truncate rounded-md px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      void (async () => {
                        setSearchPanelDismissed(true);
                        setTab("organizations");
                        const row = orgs.find((x) => x.organization_id === o.organization_id);
                        if (row) {
                          setSelOrg(row);
                          return;
                        }
                        const r = await fetch(
                          `/api/organizations/${encodeURIComponent(o.organization_id)}?expand=1`,
                        );
                        if (!r.ok) return;
                        const j = (await r.json()) as { data: OrgRow };
                        if (j.data) setSelOrg(j.data);
                      })();
                    }}
                  >
                    {o.name ?? o.organization_id}
                  </button>
                ))}
                {searchPreview.youtube_videos.slice(0, 3).map((v) => (
                  <button
                    key={v.video_id}
                    type="button"
                    className="block w-full truncate rounded-md px-2 py-1 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      void (async () => {
                        setSearchPanelDismissed(true);
                        setTab("videos");
                        const row = videos.find((x) => x.video_id === v.video_id);
                        if (row) {
                          setSelVideo(row);
                          setPlayerVideo(row);
                          return;
                        }
                        const r = await fetch(
                          `/api/youtube-videos/${encodeURIComponent(v.video_id)}?expand=1`,
                        );
                        if (!r.ok) return;
                        const j = (await r.json()) as { data: VideoRow };
                        if (j.data) {
                          setSelVideo(j.data);
                          setPlayerVideo(j.data);
                        }
                      })();
                    }}
                  >
                    {v.title ?? v.video_id}
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : null}
          </div>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
          {navItems.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant={tab === id ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-2", tab === id && "bg-sidebar-accent")}
              onClick={() => setTab(id)}
            >
              <Icon className="size-4 shrink-0 opacity-80" />
              {label}
            </Button>
          ))}
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={loading}
            onClick={() => void load(debouncedQ)}
          >
            <RefreshCw className={cn("mr-2 size-3.5", loading && "animate-spin")} />
            {loading ? "Refreshing…" : "Refresh data"}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-balance text-xl font-semibold tracking-tight md:text-2xl">{detailTitle}</h1>
          <div className="mt-2 max-w-2xl space-y-2 text-sm text-muted-foreground">
            <p>
              Explore top engineers and companies implementing cutting-edge AI solutions — built from real conference
              data and recordings.
            </p>
            <ol className="list-inside list-decimal space-y-1 text-foreground/90">
              <li>Explore their presentations from the AI Engineer World&apos;s Fair.</li>
            </ol>
            <p>
              <span className="font-medium text-foreground">Tip:</span> use the sidebar search to jump to people,
              organizations, or videos.
            </p>
          </div>
        </header>

        {error ? (
          <div
            className="mx-6 mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <ScrollArea className="h-[calc(100dvh-8.5rem)] border-b border-border lg:h-[calc(100dvh-7rem)] lg:border-r lg:border-b-0">
            <div className="space-y-2 p-4 pr-3">
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
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
            </div>
          </ScrollArea>

          <section className="min-h-[50vh] overflow-y-auto px-6 py-6 lg:min-h-0" aria-live="polite">
            {playerVideo ? (
              <YoutubeEmbed
                videoId={playerVideo.video_id}
                url={playerVideo.url}
                title={playerVideo.title}
              />
            ) : tab === "videos" ? (
              <p className="text-sm text-muted-foreground">Choose a video from the list to play it here.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a session with a linked recording, or open <strong>YouTube</strong>. For people, use{" "}
                <strong>Watch</strong> on an appearance below.
              </p>
            )}

            <div className="mt-8">
              {tab === "persons" && selPerson ? (
                <PersonDetail person={selPerson} onPlayVideo={(v) => setPlayerVideo(v)} />
              ) : null}
              {tab === "organizations" && selOrg ? <OrgDetail org={selOrg} /> : null}
              {tab === "sessions" && selSession ? (
                <SessionDetail session={selSession} onPlayVideo={(v) => setPlayerVideo(v)} />
              ) : null}
              {tab === "videos" && selVideo ? <VideoDetail video={selVideo} /> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function pickOrFirst<T, K extends string | number>(
  rows: T[],
  prev: T | null,
  id: (row: T) => K,
): T | null {
  if (!rows.length) return null;
  if (prev) {
    const pid = id(prev);
    const found = rows.find((r) => id(r) === pid);
    if (found) return found;
  }
  return rows[0] ?? null;
}

function PersonDetail({
  person,
  onPlayVideo,
}: {
  person: PersonRow;
  onPlayVideo: (v: Tables<"youtube_video">) => void;
}) {
  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {person.sessionize_profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external CDNs
          <img
            src={person.sessionize_profile_picture_url}
            alt=""
            className="h-28 w-28 shrink-0 rounded-2xl border border-border object-cover shadow-sm"
            loading="lazy"
          />
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-2xl font-semibold text-muted-foreground">
            {(person.first_name?.[0] ?? person.full_name?.[0] ?? "?").toUpperCase()}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-lg font-semibold leading-tight text-foreground">
            {person.full_name ?? person.person_id}
          </p>
          {person.role_title ? (
            <p className="text-sm text-muted-foreground">{person.role_title}</p>
          ) : null}
        </div>
      </div>
      <Tabs defaultValue="overview" className="w-full gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 text-sm">
          {person.tag_line ? <p className="text-muted-foreground">{person.tag_line}</p> : null}
          {person.bio ? (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{person.bio}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-xs">
            {person.linkedin_url ? (
              <a className="text-primary underline" href={person.linkedin_url} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            ) : null}
            {person.ai_engineer_url ? (
              <a className="text-primary underline" href={person.ai_engineer_url} target="_blank" rel="noreferrer">
                AI Engineer profile
              </a>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="relationships" className="space-y-4">
        {person.person_employed_by?.length ? (
          <RelationshipSection
            title="Employment"
            relation="EMPLOYED_BY"
            description="Organizations this person is linked to as an employee."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {person.person_employed_by.map((row, i) => (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                  secondary={row.role_title ?? undefined}
                />
              ))}
            </div>
          </RelationshipSection>
        ) : null}

        {person.person_founded_organization?.length ? (
          <RelationshipSection
            title="Founder"
            relation="FOUNDED"
            description="Organizations this person founded."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {person.person_founded_organization.map((row, i) => (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                  secondary={row.role_title ?? undefined}
                />
              ))}
            </div>
          </RelationshipSection>
        ) : null}

        {person.organization_has_ceo?.length ? (
          <RelationshipSection title="CEO role" relation="HAS_CEO" description="Where this person is listed as CEO.">
            <div className="grid gap-2 sm:grid-cols-2">
              {person.organization_has_ceo.map((row, i) => (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                  secondary={row.role_title ?? undefined}
                />
              ))}
            </div>
          </RelationshipSection>
        ) : null}

        {person.person_presented_at_session?.length ? (
          <RelationshipSection
            title="Sessions"
            relation="PRESENTED_AT"
            description="Conference sessions this person presented."
          >
            <ul className="list-inside list-disc space-y-1 text-sm">
              {person.person_presented_at_session.map((row, i) => (
                <li key={i}>{row.session?.title ?? row.session?.session_id ?? "Session"}</li>
              ))}
            </ul>
          </RelationshipSection>
        ) : null}

        {person.person_appeared_in_video?.length ? (
          <RelationshipSection
            title="YouTube appearances"
            relation="APPEARED_IN"
            description="Videos where this person appears (matched by name)."
          >
            <ul className="space-y-2">
              {person.person_appeared_in_video.map((row, i) => {
                const v = row.youtube_video;
                if (!v) return null;
                return (
                  <li key={i} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="line-clamp-1 min-w-0 flex-1">
                      {v.title ?? v.video_id}
                      {row.matched_name_variant ? (
                        <span className="text-muted-foreground"> ({row.matched_name_variant})</span>
                      ) : null}
                    </span>
                    <Button type="button" size="xs" variant="default" onClick={() => onPlayVideo(v)}>
                      Watch
                    </Button>
                  </li>
                );
              })}
            </ul>
          </RelationshipSection>
        ) : null}
      </TabsContent>
    </Tabs>
    </div>
  );
}

function OrgDetail({ org }: { org: OrgRow }) {
  return (
    <Tabs defaultValue="overview" className="w-full gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="relationships">Relationships</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 text-sm">
        {org.overview ? <p className="whitespace-pre-wrap leading-relaxed">{org.overview}</p> : null}
        {org.primary_ai_focus ? (
          <p>
            <span className="font-medium">Focus: </span>
            {org.primary_ai_focus}
          </p>
        ) : null}
      </TabsContent>
      <TabsContent value="relationships" className="space-y-4">
        {org.organization_has_ceo?.[0]?.person ? (
          <RelationshipSection title="Chief executive" relation="HAS_CEO" description="Mapped CEO for this org.">
            <RelationshipEdgeCard
              primary={
                org.organization_has_ceo[0].person?.full_name ?? org.organization_has_ceo[0].person?.person_id
              }
              secondary={org.organization_has_ceo[0].role_title ?? undefined}
            />
          </RelationshipSection>
        ) : null}

        {org.person_founded_organization?.length ? (
          <RelationshipSection title="Founders" relation="FOUNDED" description="People who founded this organization.">
            <div className="grid gap-2 sm:grid-cols-2">
              {org.person_founded_organization.map((row, i) => (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                  secondary={row.role_title ?? undefined}
                />
              ))}
            </div>
          </RelationshipSection>
        ) : null}

        {org.person_employed_by?.length ? (
          <RelationshipSection
            title="Team"
            relation="EMPLOYED_BY"
            description="People employed by this organization in the graph."
          >
            <div className="grid max-h-[420px] gap-2 overflow-y-auto sm:grid-cols-2">
              {org.person_employed_by.map((row, i) => (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                  secondary={row.role_title ?? undefined}
                />
              ))}
            </div>
          </RelationshipSection>
        ) : null}
      </TabsContent>
    </Tabs>
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
    <Tabs defaultValue="overview" className="w-full gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="relationships">Relationships</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 text-sm">
        {session.description ? <p className="leading-relaxed">{session.description}</p> : null}
        {session.extended_description ? (
          <details className="rounded-lg border">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
              Extended description
            </summary>
            <div className="border-t px-3 py-2 text-muted-foreground">{session.extended_description}</div>
          </details>
        ) : null}
        {video ? (
          <Button type="button" size="sm" onClick={() => onPlayVideo(video)}>
            Play recording
          </Button>
        ) : (
          <p className="text-muted-foreground">No linked YouTube recording for this session.</p>
        )}
      </TabsContent>
      <TabsContent value="relationships" className="space-y-4">
        {session.person_presented_at_session?.length ? (
          <RelationshipSection
            title="Presenters"
            relation="PRESENTED_AT"
            description="Speakers linked to this session."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {session.person_presented_at_session.map((row, i) => (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                />
              ))}
            </div>
          </RelationshipSection>
        ) : null}

        {video ? (
          <RelationshipSection
            title="Recording"
            relation="RECORDED_AS"
            description="Best-matched YouTube video for this talk."
          >
            <RelationshipEdgeCard primary={video.title ?? video.video_id} />
            <Button type="button" size="sm" className="mt-2" onClick={() => onPlayVideo(video)}>
              Play in player
            </Button>
          </RelationshipSection>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

function VideoDetail({ video }: { video: VideoRow }) {
  const sessLinks = normalizeVideoSessionLink(video.session_recorded_as_video);

  return (
    <Tabs defaultValue="overview" className="w-full gap-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="relationships">Relationships</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 text-sm">
        {video.description ? (
          <p className="line-clamp-6 whitespace-pre-wrap leading-relaxed md:line-clamp-none">{video.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {video.view_count != null ? <span>Views: {Number(video.view_count).toLocaleString()}</span> : null}
          {video.like_count != null ? <span>Likes: {Number(video.like_count).toLocaleString()}</span> : null}
          {video.duration ? <span>Duration: {video.duration}</span> : null}
        </div>
        {video.url ? (
          <a className="text-xs font-medium text-primary underline" href={video.url} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
        ) : null}
      </TabsContent>
      <TabsContent value="relationships" className="space-y-4">
        {sessLinks[0]?.session ? (
          <RelationshipSection
            title="Session match"
            relation="RECORDED_AS"
            description="Session inferred from title / metadata similarity."
          >
            <RelationshipEdgeCard
              primary={sessLinks[0].session?.title ?? sessLinks[0].session?.session_id ?? "Session"}
            />
          </RelationshipSection>
        ) : null}

        {video.person_appeared_in_video?.length ? (
          <RelationshipSection
            title="People"
            relation="APPEARED_IN"
            description="People detected in this video."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {video.person_appeared_in_video.map((row, i) => (
                <RelationshipEdgeCard key={i} primary={row.person?.full_name ?? row.person?.person_id ?? "Person"} />
              ))}
            </div>
          </RelationshipSection>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}
