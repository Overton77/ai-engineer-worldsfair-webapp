"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Filter,
  Landmark,
  LayoutGrid,
  Loader2,
  PanelRight,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  OrganizationCard,
  PersonCard,
  SessionCard,
  VideoCard,
} from "@/components/entity-cards";
import { RelationshipEdgeCard, RelationshipSection } from "@/components/relationship-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function YoutubePlayerFallback() {
  return (
    <div
      className="flex aspect-video w-full max-w-5xl flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/40 mx-auto"
      role="status"
      aria-busy="true"
      aria-label="Loading video player"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-center text-xs text-muted-foreground">Loading YouTube player…</p>
    </div>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-muted/50" />
      ))}
    </div>
  );
}

const YoutubePlayerWithChapters = dynamic(
  () =>
    import("@/components/youtube-player-with-chapters").then((mod) => ({
      default: mod.YoutubePlayerWithChapters,
    })),
  {
    ssr: false,
    loading: () => <YoutubePlayerFallback />,
  },
);
import {
  appendYoutubeVideoFilterParams,
  DEFAULT_YOUTUBE_VIDEO_FILTERS,
  formatFilterDuration,
  YOUTUBE_VIDEO_FILTER_BOUNDS,
  type YoutubeVideoFilterState,
} from "@/lib/api/youtube-video-filters";
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

const VIDEO_PAGE_SIZE = 12;
/** Fetch full catalog for the directory selectors (API caps at 5000 per list). */
const DIRECTORY_FETCH_LIMIT = "5000";

export function DirectoryExplorer() {
  const [tab, setTab] = useState<Tab>("videos");
  const [loading, setLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
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
  const [videoListPage, setVideoListPage] = useState(0);
  const [videoFilters, setVideoFilters] = useState<YoutubeVideoFilterState>(DEFAULT_YOUTUBE_VIDEO_FILTERS);
  const [debouncedVideoFilters, setDebouncedVideoFilters] =
    useState<YoutubeVideoFilterState>(DEFAULT_YOUTUBE_VIDEO_FILTERS);
  const [durationFilterOpen, setDurationFilterOpen] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [searchPreview, setSearchPreview] = useState<SearchPreview | null>(null);
  const [searchPanelDismissed, setSearchPanelDismissed] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async (q: string, vf: YoutubeVideoFilterState) => {
    setError(null);
    setLoading(true);
    let cancelled = false;

    const expand = "1";
    const listQs = new URLSearchParams({ expand, limit: DIRECTORY_FETCH_LIMIT });
    if (q) listQs.set("q", q);
    const videoQs = new URLSearchParams({ expand, limit: DIRECTORY_FETCH_LIMIT });
    if (q) videoQs.set("q", q);
    appendYoutubeVideoFilterParams(videoQs, vf);

    const fetchList = async <T,>(url: string): Promise<T[]> => {
      const r = await fetch(url);
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(
          typeof body?.error === "string" ? body.error : `${r.status} ${r.statusText}`,
        );
      }
      const j = (await r.json()) as { data: T[] };
      return j.data ?? [];
    };

    let pData: PersonRow[] | undefined;
    let oData: OrgRow[] | undefined;
    let sData: SessionRow[] | undefined;
    let vData: VideoRow[] | undefined;

    const maybeFinalize = () => {
      if (cancelled) return;
      if (pData === undefined || oData === undefined || sData === undefined || vData === undefined) {
        return;
      }
      setSelPerson((prev) => pickOrFirst(pData!, prev, (r) => r.person_id));
      setSelOrg((prev) => pickOrFirst(oData!, prev, (r) => r.organization_id));
      setSelSession((prev) => pickOrFirst(sData!, prev, (r) => r.session_id));
      setSelVideo((prev) => pickOrFirst(vData!, prev, (r) => r.video_id));
      hasLoadedOnceRef.current = true;
      setLoading(false);
    };

    try {
      await Promise.all([
        fetchList<PersonRow>(`/api/persons?${listQs}`).then((d) => {
          if (cancelled) return;
          pData = d;
          setPersons(d);
          maybeFinalize();
        }),
        fetchList<OrgRow>(`/api/organizations?${listQs}`).then((d) => {
          if (cancelled) return;
          oData = d;
          setOrgs(d);
          maybeFinalize();
        }),
        fetchList<SessionRow>(`/api/sessions?${listQs}`).then((d) => {
          if (cancelled) return;
          sData = d;
          setSessions(d);
          maybeFinalize();
        }),
        fetchList<VideoRow>(`/api/youtube-videos?${videoQs}`).then((d) => {
          if (cancelled) return;
          vData = d;
          setVideos(d);
          maybeFinalize();
        }),
      ]);
    } catch (e) {
      cancelled = true;
      setError(e instanceof Error ? e.message : "Failed to load directory");
      setLoading(false);
    }
  }, []);

  const navigateToPerson = useCallback(
    async (personId: string) => {
      setTab("persons");
      setPlayerVideo(null);
      const fromList = persons.find((x) => x.person_id === personId);
      if (fromList) {
        setSelPerson(fromList);
        return;
      }
      try {
        const r = await fetch(`/api/persons/${encodeURIComponent(personId)}?expand=1`);
        if (!r.ok) return;
        const j = (await r.json()) as { data: PersonRow };
        if (!j.data) return;
        setPersons((prev) => mergeById(prev, j.data, (p) => p.person_id));
        setSelPerson(j.data);
      } catch {
        /* ignore */
      }
    },
    [persons],
  );

  const navigateToOrg = useCallback(
    async (organizationId: string) => {
      setTab("organizations");
      setPlayerVideo(null);
      const fromList = orgs.find((x) => x.organization_id === organizationId);
      if (fromList) {
        setSelOrg(fromList);
        return;
      }
      try {
        const r = await fetch(`/api/organizations/${encodeURIComponent(organizationId)}?expand=1`);
        if (!r.ok) return;
        const j = (await r.json()) as { data: OrgRow };
        if (!j.data) return;
        setOrgs((prev) => mergeById(prev, j.data, (o) => o.organization_id));
        setSelOrg(j.data);
      } catch {
        /* ignore */
      }
    },
    [orgs],
  );

  const navigateToSession = useCallback(
    async (sessionId: string) => {
      setTab("sessions");
      const fromList = sessions.find((x) => x.session_id === sessionId);
      if (fromList) {
        setSelSession(fromList);
        const links = normalizeSessionVideoLink(fromList.session_recorded_as_video);
        const v = links[0]?.youtube_video;
        setPlayerVideo(v ? { ...v, youtube_channel: null } : null);
        return;
      }
      try {
        const r = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}?expand=1`);
        if (!r.ok) return;
        const j = (await r.json()) as { data: SessionRow };
        if (!j.data) return;
        setSessions((prev) => mergeById(prev, j.data, (s) => s.session_id));
        setSelSession(j.data);
        const links = normalizeSessionVideoLink(j.data.session_recorded_as_video);
        const v = links[0]?.youtube_video;
        setPlayerVideo(v ? { ...v, youtube_channel: null } : null);
      } catch {
        /* ignore */
      }
    },
    [sessions],
  );

  const navigateToVideo = useCallback(
    async (videoId: string) => {
      setTab("videos");
      const fromList = videos.find((x) => x.video_id === videoId);
      if (fromList) {
        setSelVideo(fromList);
        setPlayerVideo(fromList);
        return;
      }
      try {
        const r = await fetch(`/api/youtube-videos/${encodeURIComponent(videoId)}?expand=1`);
        if (!r.ok) return;
        const j = (await r.json()) as { data: VideoRow };
        if (!j.data) return;
        setVideos((prev) => mergeById(prev, j.data, (v) => v.video_id));
        setSelVideo(j.data);
        setPlayerVideo(j.data);
      } catch {
        /* ignore */
      }
    },
    [videos],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVideoFilters(videoFilters), 360);
    return () => clearTimeout(t);
  }, [videoFilters]);

  useEffect(() => {
    void load(debouncedQ, debouncedVideoFilters);
  }, [load, debouncedQ, debouncedVideoFilters]);

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

  useEffect(() => {
    setVideoListPage(0);
  }, [debouncedQ, debouncedVideoFilters]);

  useEffect(() => {
    if (tab !== "videos" || !selVideo) return;
    const idx = videos.findIndex((v) => v.video_id === selVideo.video_id);
    if (idx < 0) return;
    setVideoListPage(Math.floor(idx / VIDEO_PAGE_SIZE));
  }, [tab, selVideo, videos]);

  const videoSlice = useMemo(() => {
    const start = videoListPage * VIDEO_PAGE_SIZE;
    return videos.slice(start, start + VIDEO_PAGE_SIZE);
  }, [videos, videoListPage]);

  const videoPageCount = Math.max(1, Math.ceil(videos.length / VIDEO_PAGE_SIZE) || 1);
  const hasPrevVideoPage = videoListPage > 0;
  const hasNextVideoPage = (videoListPage + 1) * VIDEO_PAGE_SIZE < videos.length;

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
            onClick={() => void load(debouncedQ, videoFilters)}
          >
            <RefreshCw className={cn("mr-2 size-3.5", loading && "animate-spin")} />
            {loading
              ? hasLoadedOnceRef.current
                ? "Refreshing…"
                : "Loading directory…"
              : "Refresh data"}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border px-6 py-4">
          {tab === "videos" ? (
            <>
              <h1 className="line-clamp-2 text-pretty text-xl font-semibold tracking-tight md:text-2xl">
                {playerVideo?.title ?? selVideo?.title ?? selVideo?.video_id ?? "Conference talks on YouTube"}
              </h1>
              {playerVideo ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <Clapperboard className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    <span className="truncate">
                      {"youtube_channel" in playerVideo && playerVideo.youtube_channel?.channel_title
                        ? playerVideo.youtube_channel.channel_title
                        : "YouTube"}
                    </span>
                  </span>
                  {playerVideo.published_at ? (
                    <span className="shrink-0">
                      {new Date(playerVideo.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  ) : null}
                  {playerVideo.view_count != null ? (
                    <span className="shrink-0 tabular-nums">
                      {Number(playerVideo.view_count).toLocaleString()} views
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Pick a talk under the player. Timestamps in the description show as a chapter bar on the player;
                  hover a segment for the title and click to jump.
                </p>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </header>

        {loading ? (
          <div
            className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-2.5 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            <span>
              {hasLoadedOnceRef.current
                ? "Refreshing directory…"
                : "Loading people, organizations, sessions, and YouTube videos…"}
            </span>
          </div>
        ) : null}

        {error ? (
          <div
            className="mx-6 mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {tab === "videos" ? (
          <div
            className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
            aria-live="polite"
          >
            <div
              className={cn(
                "mx-auto flex w-full flex-col gap-8 transition-[max-width] duration-200",
                overviewOpen ? "max-w-7xl" : "max-w-5xl",
              )}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <VideoDurationFilterPanel
                  open={durationFilterOpen}
                  onOpenChange={setDurationFilterOpen}
                  value={videoFilters}
                  onChange={setVideoFilters}
                  onReset={() => setVideoFilters(DEFAULT_YOUTUBE_VIDEO_FILTERS)}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
                    <div className="relative min-w-0 flex-1 space-y-2">
                      {!overviewOpen ? (
                        <div className="flex justify-end lg:absolute lg:right-0 lg:top-0 lg:z-10">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="gap-1.5 shadow-sm"
                            onClick={() => setOverviewOpen(true)}
                          >
                            <PanelRight className="size-3.5" aria-hidden />
                            Overview
                          </Button>
                        </div>
                      ) : null}
                      {playerVideo ? (
                        <Suspense fallback={<YoutubePlayerFallback />}>
                          <YoutubePlayerWithChapters
                            videoId={playerVideo.video_id}
                            url={playerVideo.url}
                            title={playerVideo.title}
                            description={playerVideo.description}
                            durationSeconds={playerVideo.duration_seconds}
                            duration={playerVideo.duration}
                          />
                        </Suspense>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Choose a talk from the list below (or from search) to play it here.
                        </p>
                      )}
                    </div>
                    {overviewOpen ? (
                      <aside
                        className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-card/40 p-3 shadow-sm lg:max-w-[22rem] lg:border-l lg:bg-transparent lg:p-0 lg:pl-4 lg:shadow-none xl:max-w-sm"
                        aria-label="Video overview"
                      >
                        <div className="mb-2 flex shrink-0 items-center justify-between gap-2 border-b border-border pb-2 lg:pt-0">
                          <h2 className="text-sm font-semibold tracking-tight text-foreground">Overview</h2>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="size-8 shrink-0 text-muted-foreground"
                            aria-label="Close overview panel"
                            onClick={() => setOverviewOpen(false)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        <ScrollArea className="h-[min(32rem,55dvh)] w-full lg:h-[min(36rem,72dvh)]">
                          <div className="pr-3 pb-2">
                            {selVideo || playerVideo ? (
                              <VideoOverviewContent video={(selVideo ?? playerVideo)!} />
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Select a talk to read its description and stats.
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </aside>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">All talks</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={!hasPrevVideoPage}
                      aria-label="Previous page of videos"
                      onClick={() => setVideoListPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      Prev
                    </Button>
                    <span className="min-w-32 text-center text-xs text-muted-foreground tabular-nums">
                      {videos.length ? (
                        <>
                          {videoListPage + 1} / {videoPageCount}
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={!hasNextVideoPage}
                      aria-label="Next page of videos"
                      onClick={() => setVideoListPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
                {loading && !videoSlice.length ? (
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                    aria-busy="true"
                    aria-label="Loading video list"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-video animate-pulse rounded-lg border border-border bg-muted/60"
                      />
                    ))}
                  </div>
                ) : videoSlice.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {videoSlice.map((v) => (
                      <VideoCard
                        key={v.video_id}
                        video={v}
                        compact
                        active={selVideo?.video_id === v.video_id}
                        onSelect={() => {
                          setSelVideo(v);
                          setPlayerVideo(v);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No videos match the current search or numeric filters.
                  </p>
                )}
                {Number(DIRECTORY_FETCH_LIMIT) <= videos.length ? (
                  <p className="text-[11px] text-muted-foreground">
                    Showing up to {DIRECTORY_FETCH_LIMIT} results. Refine search or duration to narrow the list.
                  </p>
                ) : null}
              </div>

              {selVideo ? (
                <div className="border-t border-border pt-6">
                  <VideoRelationshipsDetail
                    video={selVideo}
                    onOpenPerson={navigateToPerson}
                    onOpenSession={navigateToSession}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,380px)_1fr]">
            <ScrollArea className="h-[calc(100dvh-8.5rem)] border-b border-border lg:h-[calc(100dvh-7rem)] lg:border-r lg:border-b-0">
              <div className="space-y-2 p-4 pr-3">
                {loading && tab === "persons" && !persons.length ? (
                  <ListSkeleton rows={6} />
                ) : null}
                {loading && tab === "organizations" && !orgs.length ? (
                  <ListSkeleton rows={6} />
                ) : null}
                {loading && tab === "sessions" && !sessions.length ? (
                  <ListSkeleton rows={6} />
                ) : null}
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
              </div>
            </ScrollArea>

            <section className="min-h-[50vh] overflow-y-auto px-6 py-6 lg:min-h-0" aria-live="polite">
              {playerVideo ? (
                <Suspense fallback={<YoutubePlayerFallback />}>
                  <YoutubePlayerWithChapters
                    videoId={playerVideo.video_id}
                    url={playerVideo.url}
                    title={playerVideo.title}
                    description={playerVideo.description}
                    durationSeconds={playerVideo.duration_seconds}
                    duration={playerVideo.duration}
                  />
                </Suspense>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a session with a linked recording, or open <strong>YouTube</strong>. For people, use{" "}
                  <strong>Watch</strong> on an appearance below.
                </p>
              )}

              <div className="mt-8">
                {tab === "persons" && selPerson ? (
                  <PersonDetail
                    person={selPerson}
                    onPlayVideo={(v) => setPlayerVideo(v)}
                    onOpenVideo={navigateToVideo}
                    onOpenOrg={navigateToOrg}
                    onOpenSession={navigateToSession}
                  />
                ) : null}
                {tab === "organizations" && selOrg ? (
                  <OrgDetail org={selOrg} onOpenPerson={navigateToPerson} />
                ) : null}
                {tab === "sessions" && selSession ? (
                  <SessionDetail
                    session={selSession}
                    onPlayVideo={(v) => setPlayerVideo(v)}
                    onOpenPerson={navigateToPerson}
                    onOpenVideo={navigateToVideo}
                  />
                ) : null}
              </div>
            </section>
          </div>
        )}
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

function mergeById<T, K extends string | number>(
  prev: T[],
  row: T,
  idFn: (row: T) => K,
): T[] {
  const pid = idFn(row);
  const i = prev.findIndex((r) => idFn(r) === pid);
  if (i >= 0) {
    const next = [...prev];
    next[i] = row;
    return next;
  }
  return [row, ...prev];
}

function VideoDurationFilterPanel({
  open,
  onOpenChange,
  value,
  onChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: YoutubeVideoFilterState;
  onChange: (v: YoutubeVideoFilterState) => void;
  onReset: () => void;
}) {
  const b = YOUTUBE_VIDEO_FILTER_BOUNDS.durationSec;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="w-full shrink-0 lg:max-w-[16rem]">
      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CollapsibleTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-auto w-full justify-between gap-2 rounded-b-none border-b-0 px-3 py-2.5 text-left font-semibold",
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Filter className="size-4 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">Duration</span>
          </span>
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 border-t pt-4 pb-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-foreground">Length range</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {formatFilterDuration(value.minDurationSec)} – {formatFilterDuration(value.maxDurationSec)}
                </span>
              </div>
              <Slider
                min={b.min}
                max={b.max}
                step={30}
                value={[value.minDurationSec, value.maxDurationSec]}
                onValueChange={(v) => {
                  if (typeof v === "number") return;
                  const [lo, hi] = v as readonly number[];
                  onChange({ minDurationSec: lo, maxDurationSec: hi });
                }}
                aria-label="Filter videos by duration"
              />
              <Button type="button" variant="ghost" size="sm" className="h-8 w-full text-xs" onClick={onReset}>
                Reset to full range
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function VideoOverviewContent({ video }: { video: Tables<"youtube_video"> | VideoRow }) {
  return (
    <div className="space-y-4 text-sm">
      {video.description ? (
        <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Description</p>
          <div className="mt-2 max-w-none whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground">
            {video.description}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">No description on file for this recording.</p>
      )}
      <dl className="grid grid-cols-1 gap-2 border-t border-border/60 pt-3 text-xs sm:grid-cols-2">
        {video.view_count != null ? (
          <div className="flex justify-between gap-2 border-b border-border/40 py-1 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Views</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {Number(video.view_count).toLocaleString()}
            </dd>
          </div>
        ) : null}
        {video.like_count != null ? (
          <div className="flex justify-between gap-2 border-b border-border/40 py-1 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Likes</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {Number(video.like_count).toLocaleString()}
            </dd>
          </div>
        ) : null}
        {video.duration ? (
          <div className="flex justify-between gap-2 border-b border-border/40 py-1 sm:block sm:border-0 sm:py-0">
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="font-medium text-foreground">{video.duration}</dd>
          </div>
        ) : null}
        {video.published_at ? (
          <div className="flex justify-between gap-2 py-1 sm:block sm:py-0">
            <dt className="text-muted-foreground">Published</dt>
            <dd className="font-medium text-foreground">
              {new Date(video.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </dd>
          </div>
        ) : null}
      </dl>
      {video.url ? (
        <a
          className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
          href={video.url}
          target="_blank"
          rel="noreferrer"
        >
          Open on YouTube
        </a>
      ) : null}
    </div>
  );
}

function VideoRelationshipsContent({
  video,
  onOpenPerson,
  onOpenSession,
}: {
  video: VideoRow;
  onOpenPerson: (id: string) => void | Promise<void>;
  onOpenSession: (id: string) => void | Promise<void>;
}) {
  const sessLinks = normalizeVideoSessionLink(video.session_recorded_as_video);
  const matchedSession = sessLinks[0]?.session;

  return (
    <div className="space-y-4">
      {matchedSession ? (
        <RelationshipSection
          title="Session match"
          relation="RECORDED_AS"
          description="Session inferred from title / metadata similarity."
        >
          <RelationshipEdgeCard
            primary={matchedSession.title ?? matchedSession.session_id ?? "Session"}
            onNavigate={
              matchedSession.session_id
                ? () => void onOpenSession(matchedSession.session_id)
                : undefined
            }
          />
        </RelationshipSection>
      ) : null}

      {video.person_appeared_in_video?.length ? (
        <RelationshipSection
          title="People"
          relation="APPEARED_IN"
          description="People detected in this video. Open a profile or stay on this video."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {video.person_appeared_in_video.map((row, i) => {
              const pid = row.person?.person_id;
              return (
                <RelationshipEdgeCard
                  key={i}
                  primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                  secondary={row.matched_name_variant ?? undefined}
                  onNavigate={pid ? () => void onOpenPerson(pid) : undefined}
                />
              );
            })}
          </div>
        </RelationshipSection>
      ) : null}

      {!matchedSession && !video.person_appeared_in_video?.length ? (
        <p className="text-sm text-muted-foreground">No linked session or people for this recording.</p>
      ) : null}
    </div>
  );
}

function VideoRelationshipsDetail({
  video,
  onOpenPerson,
  onOpenSession,
}: {
  video: VideoRow;
  onOpenPerson: (id: string) => void | Promise<void>;
  onOpenSession: (id: string) => void | Promise<void>;
}) {
  return (
    <div className="w-full space-y-3">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">Relationships</h2>
      <VideoRelationshipsContent
        video={video}
        onOpenPerson={onOpenPerson}
        onOpenSession={onOpenSession}
      />
    </div>
  );
}

function PersonDetail({
  person,
  onPlayVideo,
  onOpenVideo,
  onOpenOrg,
  onOpenSession,
}: {
  person: PersonRow;
  onPlayVideo: (v: Tables<"youtube_video">) => void;
  onOpenVideo: (videoId: string) => void | Promise<void>;
  onOpenOrg: (organizationId: string) => void | Promise<void>;
  onOpenSession: (sessionId: string) => void | Promise<void>;
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
              {person.person_employed_by.map((row, i) => {
                const oid = row.organization?.organization_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                    secondary={row.role_title ?? undefined}
                    onNavigate={oid ? () => void onOpenOrg(oid) : undefined}
                  />
                );
              })}
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
              {person.person_founded_organization.map((row, i) => {
                const oid = row.organization?.organization_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                    secondary={row.role_title ?? undefined}
                    onNavigate={oid ? () => void onOpenOrg(oid) : undefined}
                  />
                );
              })}
            </div>
          </RelationshipSection>
        ) : null}

        {person.organization_has_ceo?.length ? (
          <RelationshipSection title="CEO role" relation="HAS_CEO" description="Where this person is listed as CEO.">
            <div className="grid gap-2 sm:grid-cols-2">
              {person.organization_has_ceo.map((row, i) => {
                const oid = row.organization?.organization_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.organization?.name ?? row.organization?.organization_id ?? "Organization"}
                    secondary={row.role_title ?? undefined}
                    onNavigate={oid ? () => void onOpenOrg(oid) : undefined}
                  />
                );
              })}
            </div>
          </RelationshipSection>
        ) : null}

        {person.person_presented_at_session?.length ? (
          <RelationshipSection
            title="Sessions"
            relation="PRESENTED_AT"
            description="Conference sessions this person presented."
          >
            <div className="grid gap-2 sm:grid-cols-1">
              {person.person_presented_at_session.map((row, i) => {
                const sid = row.session?.session_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.session?.title ?? row.session?.session_id ?? "Session"}
                    onNavigate={sid ? () => void onOpenSession(sid) : undefined}
                  />
                );
              })}
            </div>
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
                  <li key={i} className="flex flex-wrap items-stretch gap-2 text-sm sm:items-center">
                    <RelationshipEdgeCard
                      className="min-w-0 flex-1"
                      primary={<span className="line-clamp-2">{v.title ?? v.video_id}</span>}
                      secondary={row.matched_name_variant ?? undefined}
                      onNavigate={() => void onOpenVideo(v.video_id)}
                    />
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      className="shrink-0 self-center"
                      onClick={() => onPlayVideo(v)}
                    >
                      Watch here
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

function OrgDetail({
  org,
  onOpenPerson,
}: {
  org: OrgRow;
  onOpenPerson: (id: string) => void | Promise<void>;
}) {
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
            {(() => {
              const edge = org.organization_has_ceo![0];
              const person = edge.person!;
              const pid = person.person_id;
              return (
                <RelationshipEdgeCard
                  primary={person.full_name ?? person.person_id}
                  secondary={edge.role_title ?? undefined}
                  onNavigate={pid ? () => void onOpenPerson(pid) : undefined}
                />
              );
            })()}
          </RelationshipSection>
        ) : null}

        {org.person_founded_organization?.length ? (
          <RelationshipSection title="Founders" relation="FOUNDED" description="People who founded this organization.">
            <div className="grid gap-2 sm:grid-cols-2">
              {org.person_founded_organization.map((row, i) => {
                const pid = row.person?.person_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                    secondary={row.role_title ?? undefined}
                    onNavigate={pid ? () => void onOpenPerson(pid) : undefined}
                  />
                );
              })}
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
              {org.person_employed_by.map((row, i) => {
                const pid = row.person?.person_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                    secondary={row.role_title ?? undefined}
                    onNavigate={pid ? () => void onOpenPerson(pid) : undefined}
                  />
                );
              })}
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
  onOpenPerson,
  onOpenVideo,
}: {
  session: SessionRow;
  onPlayVideo: (v: Tables<"youtube_video">) => void;
  onOpenPerson: (id: string) => void | Promise<void>;
  onOpenVideo: (id: string) => void | Promise<void>;
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
              {session.person_presented_at_session.map((row, i) => {
                const pid = row.person?.person_id;
                return (
                  <RelationshipEdgeCard
                    key={i}
                    primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                    onNavigate={pid ? () => void onOpenPerson(pid) : undefined}
                  />
                );
              })}
            </div>
          </RelationshipSection>
        ) : null}

        {video ? (
          <RelationshipSection
            title="Recording"
            relation="RECORDED_AS"
            description="Best-matched YouTube video for this talk."
          >
            <RelationshipEdgeCard
              primary={video.title ?? video.video_id}
              onNavigate={() => void onOpenVideo(video.video_id)}
            />
            <Button type="button" size="sm" className="mt-2" onClick={() => onPlayVideo(video)}>
              Play in player
            </Button>
          </RelationshipSection>
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

