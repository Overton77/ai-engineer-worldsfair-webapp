"use client";

import { Pencil, X } from "lucide-react";
import * as React from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";

import { createNoteAction } from "@/app/actions/notes";
import {
  ChapterList,
  VideoPlayer,
  type VideoPlayerHandle,
} from "@/components/dossier/video-player";
import { EntityNotesPanel } from "@/components/notes/entity-notes-panel";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotesLayout } from "@/lib/hooks/use-notes-layout";
import { formatTimestamp } from "@/lib/notes/derive-text";
import { useNoteUrlState } from "@/lib/notes/use-note-url-state";
import { cn } from "@/lib/utils";

type VideoNotesShellProps = {
  videoId: string;
  videoTitle: string;
  chapters: Array<{
    start_seconds: number;
    end_seconds: number | null;
    title: string;
  }>;
};

/**
 * The marquee video flow (N3 in 03a-notes-rethink-wireframes.md).
 *
 * Owns the YouTube player + the `?t=` URL param + the `?notes=` layout
 * param. Sets `window.__videoNotesCtx__` so the TimestampMention
 * extension's keyboard shortcut (⌘⇧K) can read the current player
 * position. Click handler on `.timestamp-mention` chips inside the
 * editor seeks the player.
 */
export function VideoNotesShell({
  videoId,
  videoTitle,
  chapters,
}: VideoNotesShellProps) {
  const [t, setT] = useQueryState("t", parseAsInteger.withDefault(0));
  const { notes, setLayout, note, openNote } = useNoteUrlState();
  const [layoutPref, setLayoutPref] = useNotesLayout("youtube_video", "off");
  const playerRef = React.useRef<VideoPlayerHandle>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // The current visible layout: URL param first, then user preference.
  const layout: "split" | "theatre" | "focus" | "off" =
    notes === "split" || notes === "theatre" || notes === "focus"
      ? notes
      : layoutPref === "off"
        ? "off"
        : layoutPref;

  // First-mount: if URL is empty but the user has a saved preference,
  // restore it.
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (notes === null && layoutPref !== "off") {
      setLayout(layoutPref);
    }
  }, [notes, layoutPref, setLayout]);

  // Expose ctx for the TimestampMention ⌘⇧K shortcut.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      __videoNotesCtx__?: { videoId: string; getCurrentTime: () => number };
    };
    w.__videoNotesCtx__ = {
      videoId,
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? t,
    };
    return () => {
      if (w.__videoNotesCtx__?.videoId === videoId) {
        delete w.__videoNotesCtx__;
      }
    };
  }, [videoId, t]);

  // Click on any rendered `.timestamp-mention` chip in the page seeks
  // the player. Wire at the container level so it works for chips
  // that live inside the editor (which is a portal-friendly spot).
  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest(
        '[data-mention-type="timestamp"]',
      ) as HTMLElement | null;
      if (!el) return;
      const sec = Number(el.getAttribute("data-seconds") ?? "0");
      if (Number.isFinite(sec) && sec >= 0) {
        e.preventDefault();
        e.stopPropagation();
        seek(sec);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = React.useCallback(
    (seconds: number) => {
      setT(seconds);
      playerRef.current?.seekTo(seconds);
    },
    [setT],
  );

  const setBoth = (next: "split" | "theatre" | "focus" | "off") => {
    setLayoutPref(next);
    setLayout(next === "off" ? null : next);
  };

  // Per-chapter [📝] handler: create a note pre-titled with the
  // chapter title and pin to this video. Opens it in the active note
  // slot. Insertion of the timestamp itself is best-effort — we hand
  // the note id back; the editor mount uses it.
  const onChapterNote = async (chapter: {
    start_seconds: number;
    title: string;
  }) => {
    const result = await createNoteAction({
      pin: { kind: "youtube_video", id: videoId, title: videoTitle },
      title: chapter.title,
    });
    if (!result.ok) {
      toast.error(result.error || "Failed to create note");
      return;
    }
    openNote(result.id);
    toast.success(`New note for chapter @ ${formatTimestamp(chapter.start_seconds)}`);
  };

  // ─── Layout off — original split (player + chapters only) ─────
  if (layout === "off") {
    return (
      <div
        ref={containerRef}
        className="grid gap-4 md:grid-cols-[1fr_minmax(220px,_280px)]"
      >
        <FirstVisitNudge layout={layout} onTry={() => setBoth("split")} />
        <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />
        <ChaptersAside chapters={chapters} t={t} onSeek={seek} onChapterNote={onChapterNote} />
      </div>
    );
  }

  // ─── Theatre mode — notes hidden, "Show notes" pill ───────────
  if (layout === "theatre") {
    return (
      <div ref={containerRef} className="relative">
        <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={() => setBoth("split")}
          className="fixed right-6 bottom-6 z-30 shadow-lg"
        >
          <Pencil className="size-3.5" />
          Show notes
        </Button>
      </div>
    );
  }

  // ─── Focus mode — player shrinks to bottom-right card,
  //     editor takes the whole row ───────────────────────────────
  if (layout === "focus") {
    return (
      <div ref={containerRef} className="flex min-h-[70vh] flex-col gap-3">
        <NotesPaneTabs
          videoId={videoId}
          videoTitle={videoTitle}
          chapters={chapters}
          t={t}
          seek={seek}
          onChapterNote={onChapterNote}
          getCurrentTime={() => playerRef.current?.getCurrentTime() ?? t}
          activeNoteId={note}
          onActiveNoteChange={(id) => openNote(id ?? "")}
        />
        {/* Floating mini player. Same instance via ref, just CSS-positioned. */}
        <div className="border-border/60 bg-background fixed right-4 bottom-4 z-40 w-[260px] overflow-hidden rounded-xl border shadow-2xl">
          <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />
          <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
            <span className="text-muted-foreground truncate">{videoTitle}</span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setBoth("split")}
              aria-label="Exit focus mode"
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Split mode (default once opted in) ──────────────────────
  return (
    <div ref={containerRef} className="flex min-h-[70vh] flex-col gap-2">
      <LayoutControls
        layout={layout}
        onChange={setBoth}
      />
      <ResizablePanelGroup
        orientation="horizontal"
        className="hidden min-h-[70vh] xl:flex"
      >
        <ResizablePanel defaultSize={60} minSize={40} maxSize={75}>
          <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={28}>
          <NotesPaneTabs
            videoId={videoId}
            videoTitle={videoTitle}
            chapters={chapters}
            t={t}
            seek={seek}
            onChapterNote={onChapterNote}
            getCurrentTime={() => playerRef.current?.getCurrentTime() ?? t}
            activeNoteId={note}
            onActiveNoteChange={(id) => openNote(id ?? "")}
            className="border-border/60 bg-card/40 ml-3 h-full rounded-xl border"
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Stacked layout for narrow viewports */}
      <div className="flex flex-col gap-3 xl:hidden">
        <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />
        <div className="border-border/60 bg-card/40 h-[60vh] rounded-xl border">
          <NotesPaneTabs
            videoId={videoId}
            videoTitle={videoTitle}
            chapters={chapters}
            t={t}
            seek={seek}
            onChapterNote={onChapterNote}
            getCurrentTime={() => playerRef.current?.getCurrentTime() ?? t}
            activeNoteId={note}
            onActiveNoteChange={(id) => openNote(id ?? "")}
          />
        </div>
      </div>
    </div>
  );
}

function LayoutControls({
  layout,
  onChange,
}: {
  layout: "split" | "theatre" | "focus" | "off";
  onChange: (next: "split" | "theatre" | "focus" | "off") => void;
}) {
  return (
    <div className="text-muted-foreground flex items-center justify-end gap-1 text-[10px]">
      <span>Layout</span>
      {(["split", "theatre", "focus", "off"] as const).map((m) => (
        <Button
          key={m}
          type="button"
          size="xs"
          variant={m === layout ? "default" : "ghost"}
          onClick={() => onChange(m)}
          className="h-5 px-2 text-[10px] capitalize"
        >
          {m}
        </Button>
      ))}
    </div>
  );
}

function NotesPaneTabs({
  videoId,
  videoTitle,
  chapters,
  t,
  seek,
  onChapterNote,
  getCurrentTime,
  activeNoteId,
  onActiveNoteChange,
  className,
}: {
  videoId: string;
  videoTitle: string;
  chapters: VideoNotesShellProps["chapters"];
  t: number;
  seek: (s: number) => void;
  onChapterNote: (c: { start_seconds: number; title: string }) => void;
  getCurrentTime: () => number;
  activeNoteId: string | null;
  onActiveNoteChange: (id: string | null) => void;
  className?: string;
}) {
  return (
    <Tabs defaultValue="notes" className={cn("flex h-full min-h-0 flex-col", className)}>
      <TabsList className="m-2 self-start">
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="chapters">
          Chapters ({chapters.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="notes" className="min-h-0 flex-1">
        <EntityNotesPanel
          entityRef={{ kind: "youtube_video", id: videoId, title: videoTitle }}
          activeNoteId={activeNoteId}
          onActiveNoteChange={onActiveNoteChange}
          videoCtx={{ videoId, getCurrentTime }}
        />
      </TabsContent>
      <TabsContent value="chapters" className="min-h-0 flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm italic">
            No chapters indexed.
          </p>
        ) : (
          <ol className="flex flex-col gap-0.5">
            {chapters.map((c) => {
              const isActive =
                c.start_seconds <= t &&
                (c.end_seconds === null || t < c.end_seconds);
              return (
                <li key={c.start_seconds} className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={isActive ? "secondary" : "ghost"}
                    onClick={() => seek(c.start_seconds)}
                    className="h-auto flex-1 justify-start gap-3 py-1.5 text-left"
                  >
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {formatTimestamp(c.start_seconds)}
                    </span>
                    <span className="truncate text-sm font-normal">
                      {c.title}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => onChapterNote(c)}
                    aria-label={`Pin note to chapter ${c.title}`}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="size-3" />
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ChaptersAside({
  chapters,
  t,
  onSeek,
  onChapterNote,
}: {
  chapters: VideoNotesShellProps["chapters"];
  t: number;
  onSeek: (s: number) => void;
  onChapterNote: (c: { start_seconds: number; title: string }) => void;
}) {
  return (
    <div className="border-border/60 bg-card flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-xl border p-3">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        Chapters ({chapters.length})
      </h3>
      <ol className="flex flex-col gap-0.5">
        {chapters.map((c) => {
          const isActive =
            c.start_seconds <= t &&
            (c.end_seconds === null || t < c.end_seconds);
          return (
            <li key={c.start_seconds} className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => onSeek(c.start_seconds)}
                className="h-auto flex-1 justify-start gap-3 py-1.5 text-left"
              >
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {formatTimestamp(c.start_seconds)}
                </span>
                <span className="truncate text-sm font-normal">{c.title}</span>
              </Button>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                onClick={() => onChapterNote(c)}
                aria-label={`Pin note to chapter ${c.title}`}
                className="h-7 w-7 p-0"
              >
                <Pencil className="size-3" />
              </Button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FirstVisitNudge({
  layout,
  onTry,
}: {
  layout: "split" | "theatre" | "focus" | "off";
  onTry: () => void;
}) {
  // Only show on first visit when nothing is set yet.
  const [dismissed, setDismissed] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem("aie:wn-nudge-dismissed") === "1");
  }, []);
  if (layout !== "off" || dismissed) return null;
  return (
    <div className="border-primary/40 bg-primary/5 col-span-full flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs">
      <span>
        <strong>Watch + take notes</strong> at the same time. Try split mode to see
        notes alongside the player.
      </span>
      <div className="flex gap-1">
        <Button type="button" size="xs" onClick={onTry}>
          Try split mode
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => {
            window.localStorage.setItem("aie:wn-nudge-dismissed", "1");
            setDismissed(true);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
