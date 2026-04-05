"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";

import {
  formatChapterTime,
  parseChaptersFromDescription,
  resolveVideoDurationSeconds,
  type YoutubeChapter,
} from "@/lib/youtube-chapters";
import { resolveYoutubeVideoId, youtubeIframeApiEmbedSrc } from "@/lib/youtube";
import { cn } from "@/lib/utils";

type YTPlayer = {
  destroy: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
};

function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const w = window as Window & {
    YT?: { Player: new (id: string, options?: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  };

  if (w.YT?.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };

    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
}

function chaptersToSegments(chapters: YoutubeChapter[], totalSeconds: number): Array<{
  start: number;
  end: number;
  label: string;
}> {
  if (!chapters.length || totalSeconds <= 0) return [];
  const out: Array<{ start: number; end: number; label: string }> = [];
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i]!;
    const start = c.startSeconds;
    const end = i + 1 < chapters.length ? chapters[i + 1]!.startSeconds : totalSeconds;
    if (end > start) {
      out.push({ start, end, label: c.label });
    }
  }
  return out;
}

type YoutubePlayerWithChaptersProps = {
  videoId?: string | null;
  url?: string | null;
  title?: string | null;
  description?: string | null;
  durationSeconds?: number | null;
  duration?: string | null;
  className?: string;
};

export function YoutubePlayerWithChapters({
  videoId,
  url,
  title,
  description,
  durationSeconds,
  duration,
  className,
}: YoutubePlayerWithChaptersProps) {
  const resolvedId = resolveYoutubeVideoId(videoId, url);
  const chapters = useMemo(() => parseChaptersFromDescription(description), [description]);
  const totalSeconds = useMemo(
    () => resolveVideoDurationSeconds(durationSeconds ?? null, duration ?? null, chapters),
    [durationSeconds, duration, chapters],
  );
  const segments = useMemo(
    () => chaptersToSegments(chapters, totalSeconds),
    [chapters, totalSeconds],
  );

  const iframeDomId = useId().replace(/:/g, "_");
  const playerRef = useRef<YTPlayer | null>(null);
  const isBrowser = typeof window !== "undefined";
  const origin = isBrowser ? window.location.origin : "";

  useEffect(() => {
    if (!resolvedId || !origin) return;
    let cancelled = false;

    void (async () => {
      await loadYoutubeIframeApi();
      if (cancelled) return;
      const YT = (window as Window & { YT?: { Player: new (id: string, o?: object) => YTPlayer } }).YT;
      if (!YT?.Player) return;

      try {
        playerRef.current?.destroy();
      } catch {
        /* iframe may already be gone */
      }
      playerRef.current = null;

      new YT.Player(iframeDomId, {
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (!cancelled) playerRef.current = e.target;
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
  }, [resolvedId, origin, iframeDomId]);

  const seekTo = useCallback((seconds: number) => {
    try {
      const p = playerRef.current;
      p?.seekTo?.(seconds, true);
      p?.playVideo?.();
    } catch {
      /* noop */
    }
  }, []);

  if (!resolvedId) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        No playable YouTube id for this record.
      </div>
    );
  }

  if (!isBrowser || !origin) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full animate-pulse rounded-xl border border-border bg-muted",
          className,
        )}
        aria-hidden
      />
    );
  }

  const src = youtubeIframeApiEmbedSrc(resolvedId, origin);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border shadow-lg ring-1 ring-black/5 dark:ring-white/10",
        className,
      )}
    >
      <div className="relative aspect-video w-full bg-black">
        <iframe
          key={resolvedId}
          id={iframeDomId}
          title={title ? `YouTube: ${title}` : "YouTube video"}
          src={src}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />

        {segments.length > 0 ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-linear-to-t from-black/85 via-black/40 to-transparent px-2 pb-2 pt-10"
            role="presentation"
          >
            <p className="pointer-events-none mb-1.5 px-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
              Chapters — hover for titles, click to jump
            </p>
            <div
              className="pointer-events-auto flex h-2.5 w-full overflow-hidden rounded-sm bg-black/50 ring-1 ring-white/20"
              role="group"
              aria-label="Video chapters"
            >
              {segments.map((seg, i) => {
                const pct = ((seg.end - seg.start) / totalSeconds) * 100;
                const tip = `${formatChapterTime(seg.start)} · ${seg.label}`;
                return (
                  <button
                    key={`${seg.start}-${i}`}
                    type="button"
                    title={tip}
                    aria-label={tip}
                    className={cn(
                      "relative h-full min-w-[6px] border-r border-white/25 bg-emerald-500/35 transition-colors last:border-r-0 hover:bg-emerald-400/55 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-white",
                      i % 2 === 1 && "bg-teal-500/35 hover:bg-teal-400/55",
                    )}
                    style={{ width: `${Math.max(pct, 0.8)}%` }}
                    onClick={() => seekTo(seg.start)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
