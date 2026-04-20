"use client";

import * as React from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  videoId: string;
  /** Initial timestamp in seconds (deep-link). */
  startSeconds?: number;
  className?: string;
};

/**
 * Lazy YouTube embed. We render a thumbnail + play button until the
 * user opts in (no autoplay, no third-party iframe on first paint, no
 * cookies-on-load). Once mounted, the iframe stays mounted and uses
 * the YT Player API for chapter-jumps via `seekTo`.
 *
 * Exposes `seekTo(seconds)` via ref so chapter buttons can re-seek.
 */
export type VideoPlayerHandle = {
  seekTo: (seconds: number) => void;
  /** Returns the current playback position in seconds, or 0 when not loaded. */
  getCurrentTime: () => number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLIFrameElement | string,
        opts: { events?: Record<string, unknown> },
      ) => YTPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayerInstance = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  getCurrentTime: () => number;
  destroy: () => void;
};

let ytApiPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<void>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
  return ytApiPromise;
}

export const VideoPlayer = React.forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer({ videoId, startSeconds = 0, className }, ref) {
    const [active, setActive] = React.useState(startSeconds > 0);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const playerRef = React.useRef<YTPlayerInstance | null>(null);

    React.useEffect(() => {
      if (!active) return;
      let cancelled = false;
      loadYouTubeAPI().then(() => {
        if (cancelled || !iframeRef.current || !window.YT) return;
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {},
        });
      });
      return () => {
        cancelled = true;
        playerRef.current?.destroy();
        playerRef.current = null;
      };
    }, [active]);

    React.useImperativeHandle(
      ref,
      () => ({
        seekTo: (seconds: number) => {
          if (!active) {
            setActive(true);
            return;
          }
          playerRef.current?.seekTo(seconds, true);
          playerRef.current?.playVideo();
        },
        getCurrentTime: () => {
          try {
            return playerRef.current?.getCurrentTime() ?? 0;
          } catch {
            return 0;
          }
        },
      }),
      [active],
    );

    if (!active) {
      const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      return (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label="Play video"
          className={cn(
            "group/poster bg-muted relative aspect-video w-full overflow-hidden rounded-xl",
            className,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover/poster:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover/poster:bg-black/50">
            <span className="bg-white/95 text-black flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg">
              <Play className="size-4 fill-current" />
              Play video
            </span>
          </div>
        </button>
      );
    }

    const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${Math.floor(
      startSeconds,
    )}&enablejsapi=1`;

    return (
      <div className={cn("aspect-video w-full overflow-hidden rounded-xl", className)}>
        <iframe
          ref={iframeRef}
          src={src}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
          className="h-full w-full"
        />
      </div>
    );
  },
);

type ChapterListProps = {
  chapters: Array<{ start_seconds: number; end_seconds: number | null; title: string }>;
  activeSeconds: number;
  onSeek: (seconds: number) => void;
  className?: string;
};

function formatTime(s: number): string {
  const minutes = Math.floor(s / 60);
  const seconds = Math.floor(s % 60);
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ChapterList({
  chapters,
  activeSeconds,
  onSeek,
  className,
}: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">No chapters indexed.</p>
    );
  }
  return (
    <ol className={cn("flex flex-col gap-1", className)}>
      {chapters.map((c) => {
        const isActive =
          c.start_seconds <= activeSeconds &&
          (c.end_seconds === null || activeSeconds < c.end_seconds);
        return (
          <li key={c.start_seconds}>
            <Button
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSeek(c.start_seconds)}
              className="h-auto w-full justify-start gap-3 py-1.5 text-left"
            >
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {formatTime(c.start_seconds)}
              </span>
              <span className="truncate text-sm font-normal">{c.title}</span>
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
