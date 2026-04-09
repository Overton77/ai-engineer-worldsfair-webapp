"use client";

import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { EntityUserPanel } from "@/components/directory/entity-user-panel";
import {
  OrganizationCard,
  PersonCard,
  SessionCard,
  VideoCard,
} from "@/components/entity-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { EntitySearch } from "@/components/directory/entity-search";
import { DateSortFilter, sortParamsFromOption, type SortOption } from "@/components/directory/date-sort-filter";

import {
  type Tab,
  type PersonRow,
  type OrgRow,
  type SessionRow,
  type VideoRow,
  type Viewer,
  hasPersonDetail,
  hasOrgDetail,
  hasSessionDetail,
  fetchJsonData,
  pickOrFirst,
  mergeById,
  VIDEO_PAGE_SIZE,
  DIRECTORY_LIST_LIMIT,
} from "@/components/directory/directory-types";
import { PersonDetailPanel } from "@/components/directory/person-detail-panel";
import { OrgDetailPanel } from "@/components/directory/org-detail-panel";
import { SessionDetailPanel } from "@/components/directory/session-detail-panel";
import { cn } from "@/lib/utils";

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-muted/50" />
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading details">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

type DetailLoadingState = {
  organizations: boolean;
  persons: boolean;
  sessions: boolean;
};

export function DirectoryExplorer({ viewer }: { viewer: Viewer }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openPerson = searchParams.get("openPerson");
  const openSession = searchParams.get("openSession");
  const [tab, setTab] = useState<Tab>("videos");
  const hasLoadedOnceRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const [persons, setPersons] = useState<PersonRow[]>([]);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);

  const [selPerson, setSelPerson] = useState<PersonRow | null>(null);
  const [selOrg, setSelOrg] = useState<OrgRow | null>(null);
  const [selSession, setSelSession] = useState<SessionRow | null>(null);

  const [videoListPage, setVideoListPage] = useState(0);
  const [videoTotal, setVideoTotal] = useState(0);
  const [videoSort, setVideoSort] = useState<SortOption>("newest");
  const [videosLoading, setVideosLoading] = useState(true);
  const [entitiesLoading, setEntitiesLoading] = useState(true);

  // Per-tab search
  const [videoSearch, setVideoSearch] = useState("");
  const [personSearch, setPersonSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");

  const [detailLoading, setDetailLoading] = useState<DetailLoadingState>({
    organizations: false,
    persons: false,
    sessions: false,
  });

  // Debounced search values
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState("");
  const [debouncedPersonSearch, setDebouncedPersonSearch] = useState("");
  const [debouncedOrgSearch, setDebouncedOrgSearch] = useState("");
  const [debouncedSessionSearch, setDebouncedSessionSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedVideoSearch(videoSearch.trim()), 320);
    return () => clearTimeout(t);
  }, [videoSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPersonSearch(personSearch.trim()), 320);
    return () => clearTimeout(t);
  }, [personSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrgSearch(orgSearch.trim()), 320);
    return () => clearTimeout(t);
  }, [orgSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSessionSearch(sessionSearch.trim()), 320);
    return () => clearTimeout(t);
  }, [sessionSearch]);

  const fetchVideosPage = useCallback(async () => {
    const videoQs = new URLSearchParams({
      limit: String(VIDEO_PAGE_SIZE),
      offset: String(videoListPage * VIDEO_PAGE_SIZE),
    });
    if (debouncedVideoSearch) videoQs.set("q", debouncedVideoSearch);
    const { sort_by, sort_dir } = sortParamsFromOption(videoSort);
    videoQs.set("sort_by", sort_by);
    videoQs.set("sort_dir", sort_dir);
    return fetchJsonData<{ data: VideoRow[]; meta: { total: number } }>(
      `/api/youtube-videos?${videoQs}`,
    );
  }, [debouncedVideoSearch, videoSort, videoListPage]);

  const loadEntities = useCallback(async (personQ: string, orgQ: string, sessionQ: string) => {
    const pQs = new URLSearchParams({ limit: DIRECTORY_LIST_LIMIT });
    if (personQ) pQs.set("q", personQ);
    const oQs = new URLSearchParams({ limit: DIRECTORY_LIST_LIMIT });
    if (orgQ) oQs.set("q", orgQ);
    const sQs = new URLSearchParams({ limit: DIRECTORY_LIST_LIMIT });
    if (sessionQ) sQs.set("q", sessionQ);

    return Promise.all([
      fetchJsonData<{ data: PersonRow[] }>(`/api/persons?${pQs}`),
      fetchJsonData<{ data: OrgRow[] }>(`/api/organizations?${oQs}`),
      fetchJsonData<{ data: SessionRow[] }>(`/api/sessions?${sQs}`),
    ]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEntitiesLoading(true);
    setError(null);
    void loadEntities(debouncedPersonSearch, debouncedOrgSearch, debouncedSessionSearch)
      .then(([personsRes, orgsRes, sessionsRes]) => {
        if (cancelled) return;
        const pData = personsRes.data ?? [];
        const oData = orgsRes.data ?? [];
        const sData = sessionsRes.data ?? [];
        setPersons(pData);
        setOrgs(oData);
        setSessions(sData);
        setSelPerson((prev) => pickOrFirst(pData, prev, (r) => r.person_id));
        setSelOrg((prev) => pickOrFirst(oData, prev, (r) => r.organization_id));
        setSelSession((prev) => pickOrFirst(sData, prev, (r) => r.session_id));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load directory");
      })
      .finally(() => {
        if (!cancelled) setEntitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadEntities, debouncedPersonSearch, debouncedOrgSearch, debouncedSessionSearch]);

  useEffect(() => {
    let cancelled = false;
    setVideosLoading(true);
    void fetchVideosPage()
      .then((videosRes) => {
        if (cancelled) return;
        const vData = videosRes.data ?? [];
        setVideos(vData);
        setVideoTotal(
          typeof videosRes.meta?.total === "number" ? videosRes.meta.total : vData.length,
        );
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load videos");
      })
      .finally(() => {
        if (!cancelled) setVideosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchVideosPage]);

  useEffect(() => {
    if (!entitiesLoading && !videosLoading) {
      hasLoadedOnceRef.current = true;
    }
  }, [entitiesLoading, videosLoading]);

  const ensurePersonDetail = useCallback(
    async (personId: string, opts?: { select?: boolean }) => {
      setDetailLoading((current) => ({ ...current, persons: true }));
      try {
        const response = await fetchJsonData<{ data: PersonRow }>(
          `/api/persons/${encodeURIComponent(personId)}?expand=1`,
        );
        if (!response.data) return;
        setPersons((prev) => mergeById(prev, response.data, (row) => row.person_id));
        if (opts?.select === true) {
          setSelPerson(response.data);
        } else {
          setSelPerson((prev) =>
            prev?.person_id === response.data.person_id ? response.data : prev,
          );
        }
      } catch {
        /* keep lightweight row */
      } finally {
        setDetailLoading((current) => ({ ...current, persons: false }));
      }
    },
    [],
  );

  const ensureOrgDetail = useCallback(
    async (organizationId: string, opts?: { select?: boolean }) => {
      setDetailLoading((current) => ({ ...current, organizations: true }));
      try {
        const response = await fetchJsonData<{ data: OrgRow }>(
          `/api/organizations/${encodeURIComponent(organizationId)}?expand=1`,
        );
        if (!response.data) return;
        setOrgs((prev) => mergeById(prev, response.data, (row) => row.organization_id));
        if (opts?.select === true) {
          setSelOrg(response.data);
        } else {
          setSelOrg((prev) =>
            prev?.organization_id === response.data.organization_id ? response.data : prev,
          );
        }
      } catch {
        /* keep lightweight row */
      } finally {
        setDetailLoading((current) => ({ ...current, organizations: false }));
      }
    },
    [],
  );

  const ensureSessionDetail = useCallback(
    async (sessionId: string, opts?: { select?: boolean }) => {
      setDetailLoading((current) => ({ ...current, sessions: true }));
      try {
        const response = await fetchJsonData<{ data: SessionRow }>(
          `/api/sessions/${encodeURIComponent(sessionId)}?expand=1`,
        );
        if (!response.data) return;
        setSessions((prev) => mergeById(prev, response.data, (row) => row.session_id));
        if (opts?.select === true) {
          setSelSession(response.data);
        } else {
          setSelSession((prev) =>
            prev?.session_id === response.data.session_id ? response.data : prev,
          );
        }
      } catch {
        /* keep lightweight row */
      } finally {
        setDetailLoading((current) => ({ ...current, sessions: false }));
      }
    },
    [],
  );

  const navigateToPerson = useCallback(
    async (personId: string) => {
      setTab("persons");
      const fromList = persons.find((x) => x.person_id === personId);
      if (fromList) {
        setSelPerson(fromList);
        if (!hasPersonDetail(fromList)) await ensurePersonDetail(personId, { select: false });
        return;
      }
      await ensurePersonDetail(personId, { select: true });
    },
    [ensurePersonDetail, persons],
  );

  const navigateToOrg = useCallback(
    async (organizationId: string) => {
      setTab("organizations");
      const fromList = orgs.find((x) => x.organization_id === organizationId);
      if (fromList) {
        setSelOrg(fromList);
        if (!hasOrgDetail(fromList)) await ensureOrgDetail(organizationId, { select: false });
        return;
      }
      await ensureOrgDetail(organizationId, { select: true });
    },
    [ensureOrgDetail, orgs],
  );

  const navigateToSession = useCallback(
    async (sessionId: string) => {
      setTab("sessions");
      const fromList = sessions.find((x) => x.session_id === sessionId);
      if (fromList) {
        setSelSession(fromList);
        if (!hasSessionDetail(fromList)) await ensureSessionDetail(sessionId, { select: false });
        return;
      }
      await ensureSessionDetail(sessionId, { select: true });
    },
    [ensureSessionDetail, sessions],
  );

  const navigateToVideo = useCallback(
    (videoId: string) => {
      router.push(`/videos/${encodeURIComponent(videoId)}`);
    },
    [router],
  );

  useEffect(() => {
    if (!openPerson && !openSession) return;
    void (async () => {
      try {
        if (openPerson) {
          setTab("persons");
          await ensurePersonDetail(openPerson, { select: true });
        } else if (openSession) {
          setTab("sessions");
          await ensureSessionDetail(openSession, { select: true });
        }
      } finally {
        router.replace("/directory", { scroll: false });
      }
    })();
  }, [openPerson, openSession, ensurePersonDetail, ensureSessionDetail, router]);

  useEffect(() => {
    if (!selPerson || hasPersonDetail(selPerson)) return;
    void ensurePersonDetail(selPerson.person_id, { select: false });
  }, [ensurePersonDetail, selPerson]);

  useEffect(() => {
    if (!selOrg || hasOrgDetail(selOrg)) return;
    void ensureOrgDetail(selOrg.organization_id, { select: false });
  }, [ensureOrgDetail, selOrg]);

  useEffect(() => {
    if (!selSession || hasSessionDetail(selSession)) return;
    void ensureSessionDetail(selSession.session_id, { select: false });
  }, [ensureSessionDetail, selSession]);

  useEffect(() => {
    setVideoListPage(0);
  }, [debouncedVideoSearch, videoSort]);

  const videoPageCount = Math.max(1, Math.ceil(videoTotal / VIDEO_PAGE_SIZE) || 1);
  const hasPrevVideoPage = videoListPage > 0;
  const hasNextVideoPage = (videoListPage + 1) * VIDEO_PAGE_SIZE < videoTotal;

  return (
    <div className="flex min-h-0 w-full flex-1">
      <AppSidebar viewer={viewer} activeTab={tab} onTabChange={(t) => setTab(t as Tab)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {entitiesLoading || videosLoading ? (
          <div
            className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-2 text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            <span>
              {hasLoadedOnceRef.current ? "Refreshing..." : "Loading directory..."}
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
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-lg font-semibold tracking-tight">Conference talks</h1>
                <div className="flex items-center gap-2">
                  <div className="w-48 sm:w-56">
                    <EntitySearch
                      value={videoSearch}
                      onChange={setVideoSearch}
                      placeholder="Search videos..."
                    />
                  </div>
                  <DateSortFilter value={videoSort} onChange={setVideoSort} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Select a talk to open its page, play the video, read the description, and keep private notes.
              </p>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    All talks
                    {videoTotal > 0 ? (
                      <span className="ml-2 font-normal text-muted-foreground">({videoTotal})</span>
                    ) : null}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={!hasPrevVideoPage || videosLoading}
                      onClick={() => setVideoListPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      Prev
                    </Button>
                    <span className="min-w-36 text-center text-xs text-muted-foreground tabular-nums">
                      {videoTotal > 0
                        ? `Page ${videoListPage + 1} / ${videoPageCount} · ${videoTotal} total`
                        : "\u2014"}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      disabled={!hasNextVideoPage || videosLoading}
                      onClick={() => setVideoListPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
                {videosLoading && !videos.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-video animate-pulse rounded-lg border border-border bg-muted/60"
                      />
                    ))}
                  </div>
                ) : videos.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {videos.map((v) => (
                      <VideoCard
                        key={v.video_id}
                        video={v}
                        compact
                        href={`/videos/${encodeURIComponent(v.video_id)}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No videos match the current search or filters.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,380px)_1fr]">
            <div className="flex flex-col border-b border-border lg:border-r lg:border-b-0">
              <div className="border-b border-border p-3">
                <EntitySearch
                  value={tab === "persons" ? personSearch : tab === "organizations" ? orgSearch : sessionSearch}
                  onChange={tab === "persons" ? setPersonSearch : tab === "organizations" ? setOrgSearch : setSessionSearch}
                  placeholder={`Search ${tab === "persons" ? "people" : tab}...`}
                />
              </div>
              <ScrollArea className="h-[calc(100dvh-12rem)] lg:h-[calc(100dvh-10rem)]">
                <div className="space-y-2 p-4 pr-3">
                  {entitiesLoading && tab === "persons" && !persons.length ? <ListSkeleton rows={6} /> : null}
                  {entitiesLoading && tab === "organizations" && !orgs.length ? <ListSkeleton rows={6} /> : null}
                  {entitiesLoading && tab === "sessions" && !sessions.length ? <ListSkeleton rows={6} /> : null}
                  {tab === "persons" &&
                    persons.map((p) => (
                      <PersonCard
                        key={p.person_id}
                        person={p}
                        active={selPerson?.person_id === p.person_id}
                        onSelect={() => setSelPerson(p)}
                      />
                    ))}
                  {tab === "organizations" &&
                    orgs.map((o) => (
                      <OrganizationCard
                        key={o.organization_id}
                        org={o}
                        active={selOrg?.organization_id === o.organization_id}
                        onSelect={() => setSelOrg(o)}
                      />
                    ))}
                  {tab === "sessions" &&
                    sessions.map((s) => (
                      <SessionCard
                        key={s.session_id}
                        session={s}
                        active={selSession?.session_id === s.session_id}
                        onSelect={() => setSelSession(s)}
                      />
                    ))}
                  {!entitiesLoading && tab === "persons" && !persons.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No people found.</p>
                  ) : null}
                  {!entitiesLoading && tab === "organizations" && !orgs.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No organizations found.</p>
                  ) : null}
                  {!entitiesLoading && tab === "sessions" && !sessions.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No sessions found.</p>
                  ) : null}
                </div>
              </ScrollArea>
            </div>

            <section className="min-h-[50vh] overflow-y-auto px-6 py-6 lg:min-h-0" aria-live="polite">
              <div>
                {tab === "persons" && selPerson ? (
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      {detailLoading.persons ? (
                        <DetailSkeleton />
                      ) : (
                        <PersonDetailPanel
                          person={selPerson}
                          onOpenVideo={navigateToVideo}
                          onOpenOrg={navigateToOrg}
                          onOpenSession={navigateToSession}
                        />
                      )}
                    </div>
                    <EntityUserPanel
                      viewer={viewer}
                      entity={{
                        entityId: selPerson.person_id,
                        entitySubtitle: selPerson.role_title,
                        entityTitle: selPerson.full_name ?? selPerson.person_id,
                        entityType: "person",
                      }}
                    />
                  </div>
                ) : null}
                {tab === "organizations" && selOrg ? (
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      {detailLoading.organizations ? (
                        <DetailSkeleton />
                      ) : (
                        <OrgDetailPanel org={selOrg} onOpenPerson={navigateToPerson} />
                      )}
                    </div>
                    <EntityUserPanel
                      viewer={viewer}
                      entity={{
                        entityId: selOrg.organization_id,
                        entitySubtitle: selOrg.organization_type,
                        entityTitle: selOrg.name ?? selOrg.organization_id,
                        entityType: "organization",
                      }}
                    />
                  </div>
                ) : null}
                {tab === "sessions" && selSession ? (
                  <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      {detailLoading.sessions ? (
                        <DetailSkeleton />
                      ) : (
                        <SessionDetailPanel
                          session={selSession}
                          onOpenPerson={navigateToPerson}
                          onOpenVideo={navigateToVideo}
                        />
                      )}
                    </div>
                    <EntityUserPanel
                      viewer={viewer}
                      entity={{
                        entityId: selSession.session_id,
                        entitySubtitle: selSession.level,
                        entityTitle: selSession.title ?? selSession.session_id,
                        entityType: "session",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

