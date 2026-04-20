"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import * as React from "react";

import {
  ChapterList,
  VideoPlayer,
  type VideoPlayerHandle,
} from "@/components/dossier/video-player";

type VideoShellProps = {
  videoId: string;
  chapters: Array<{
    start_seconds: number;
    end_seconds: number | null;
    title: string;
  }>;
};

/**
 * Couples the lazy YouTube player to the chapter list and the `?t=`
 * URL param. When the user clicks a chapter the URL updates so the
 * timestamp is sharable; reloading lands at the same chapter.
 */
export function VideoShell({ videoId, chapters }: VideoShellProps) {
  const [t, setT] = useQueryState("t", parseAsInteger.withDefault(0));
  const playerRef = React.useRef<VideoPlayerHandle>(null);

  const onSeek = (seconds: number) => {
    setT(seconds);
    playerRef.current?.seekTo(seconds);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_minmax(220px,_280px)]">
      <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />
      <div className="border-border/60 bg-card flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-xl border p-3">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Chapters ({chapters.length})
        </h3>
        <ChapterList chapters={chapters} activeSeconds={t} onSeek={onSeek} />
      </div>
    </div>
  );
}
