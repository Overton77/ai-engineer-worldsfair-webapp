"use client";

import { ArrowLeft, Clapperboard, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useMemo } from "react";

import { DescriptionWithLinks } from "@/components/description-with-links";
import { VideoRelationshipsPanel } from "@/components/directory/video-relationships-panel";
import { EntityUserPanel } from "@/components/directory/entity-user-panel";
import type { VideoRow, Viewer } from "@/components/directory/directory-types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

function YoutubePlayerFallback() {
  return (
    <div
      className="mx-auto flex aspect-video w-full max-w-5xl flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/40"
      role="status"
      aria-busy="true"
      aria-label="Loading video player"
    >
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-center text-xs text-muted-foreground">Loading YouTube player…</p>
    </div>
  );
}

const YoutubePlayerWithChapters = dynamic(
  () =>
    import("@/components/youtube-player-with-chapters").then((mod) => ({
      default: mod.YoutubePlayerWithChapters,
    })),
  { ssr: false, loading: () => <YoutubePlayerFallback /> },
);

export function VideoPage({
  initialVideo,
  viewer,
}: {
  initialVideo: VideoRow | Tables<"youtube_video">;
  viewer: Viewer;
}) {
  const video = initialVideo as VideoRow;
  const channelTitle = useMemo(() => {
    return "youtube_channel" in video && video.youtube_channel?.channel_title
      ? video.youtube_channel.channel_title
      : "YouTube";
  }, [video]);

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/directory"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "gap-1.5 text-muted-foreground",
          })}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to directory
        </Link>
      </div>

      <header className="space-y-2">
        <h1 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
          {video.title ?? video.video_id}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
            <Clapperboard className="size-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{channelTitle}</span>
          </span>
          {video.published_at ? (
            <span className="shrink-0">
              {new Date(video.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </span>
          ) : null}
          {video.view_count != null ? (
            <span className="shrink-0 tabular-nums">
              {Number(video.view_count).toLocaleString()} views
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[1fr_minmax(280px,380px)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Suspense fallback={<YoutubePlayerFallback />}>
            <YoutubePlayerWithChapters
              key={video.video_id}
              videoId={video.video_id}
              url={video.url}
              title={video.title}
              description={video.description}
              durationSeconds={video.duration_seconds}
              duration={video.duration}
              thumbnailUrl={video.thumbnail_url}
              loading={false}
            />
          </Suspense>

          <section className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </h2>
            <DescriptionWithLinks text={video.description} />
            {video.url ? (
              <a
                className="mt-4 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
                href={video.url}
                target="_blank"
                rel="noreferrer"
              >
                Open on YouTube
              </a>
            ) : null}
          </section>

          <section
            className={cn(
              "rounded-xl border border-border/80 bg-card/30 p-4 sm:p-5",
            )}
          >
            <VideoRelationshipsPanel video={video} />
          </section>
        </div>

        <aside className="min-w-0 space-y-2 lg:sticky lg:top-6" aria-label="Notes and profile">
          <EntityUserPanel
            viewer={viewer}
            entity={{
              entityId: video.video_id,
              entitySubtitle: channelTitle === "YouTube" ? null : channelTitle,
              entityTitle: video.title ?? video.video_id,
              entityType: "youtube_video",
            }}
          />
        </aside>
      </div>
    </main>
  );
}
