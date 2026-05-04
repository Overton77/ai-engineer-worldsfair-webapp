"use client";

import { Maximize2, Minimize2, Pencil, X } from "lucide-react";
import * as React from "react";
import { parseAsInteger, useQueryState } from "nuqs";
import { toast } from "sonner";

import { createNoteAction } from "@/app/actions/notes";
import {
  VideoPlayer,
  type VideoPlayerHandle,
} from "@/components/dossier/video-player";
import { DraggablePip } from "@/components/notes/draggable-pip";
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

type Layout = "split" | "theatre" | "focus" | "off";

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
 * param. The `<VideoPlayer>` is mounted EXACTLY ONCE for the lifetime
 * of this component; layout switches only re-parent / re-style the
 * surrounding chrome so the iframe never reloads. This is what makes
 * "swap to PiP while I keep watching" actually work.
 *
 * Sets `window.__videoNotesCtx__` so the TimestampMention extension's
 * keyboard shortcut (⌘⇧K) can read the current player position.
 */
export function VideoNotesShell({
  videoId,
  videoTitle,
  chapters,
}: VideoNotesShellProps) {
  const [t, setT] = useQueryState("t", parseAsInteger.withDefault(0));
  const { notes, setLayout, note, openPanelNote, clearPanelNote } =
    useNoteUrlState();
  const [layoutPref, setLayoutPref] = useNotesLayout("youtube_video", "off");
  const playerRef = React.useRef<VideoPlayerHandle>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  // Tracked at the top so the rules-of-hooks gate doesn't trip when
  // we early-return for off/theatre/focus before reaching split.
  const isWide = useIsWide();

  // The current visible layout: URL param first, then user preference.
  const layout: Layout =
    notes === "split" || notes === "theatre" || notes === "focus"
      ? notes
      : layoutPref === "off"
        ? "off"
        : layoutPref;

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
  // the player. Wire at the document level so it works for chips that
  // live inside the editor (which can be portalled).
  React.useEffect(() => {
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

  // Esc cycles focus/theatre back to split (the "home" mode for video).
  React.useEffect(() => {
    if (layout !== "focus" && layout !== "theatre") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setBoth("split");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = React.useCallback(
    (seconds: number) => {
      setT(seconds);
      playerRef.current?.seekTo(seconds);
    },
    [setT],
  );

  const setBoth = (next: Layout) => {
    setLayoutPref(next);
    setLayout(next === "off" ? null : next);
  };

  // Per-chapter [📝] handler: create a note pre-titled with the
  // chapter title and pin to this video. Opens it in the active note
  // slot (inline; the drawer self-suppresses when ?notes= is set).
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
    // Make sure we're in split so the new note opens inline rather
    // than triggering the global quick-drawer.
    if (layout === "off") setBoth("split");
    openPanelNote(result.id, "split");
    toast.success(`New note for chapter @ ${formatTimestamp(chapter.start_seconds)}`);
  };

  // ─── Single, stable player element ────────────────────────────
  // Rendered once and parked in different containers per layout.
  // This is the fix for the dual-mount bug where two <VideoPlayer>
  // instances shared one ref and the iframe reloaded on every
  // layout switch.
  const playerEl = React.useMemo(
    () => <VideoPlayer ref={playerRef} videoId={videoId} startSeconds={t} />,
    // We intentionally exclude `t` from deps — the player owns its
    // own playback position once mounted, and remounting on every
    // ?t= change would defeat the whole purpose of this shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [videoId],
  );

  const notesPane = (
    <NotesPaneTabs
      videoId={videoId}
      videoTitle={videoTitle}
      chapters={chapters}
      t={t}
      seek={seek}
      onChapterNote={onChapterNote}
      getCurrentTime={() => playerRef.current?.getCurrentTime() ?? t}
      activeNoteId={note}
      onActiveNoteChange={(id) =>
        id ? openPanelNote(id, layout === "focus" ? "focus" : "split") : clearPanelNote()
      }
    />
  );

  // ─── Layout: off — original chapter-list aside ────────────────
  if (layout === "off") {
    return (
      <div ref={containerRef} className="flex flex-col gap-3">
        <LayoutControls layout={layout} onChange={setBoth} />
        <div className="grid gap-4 md:grid-cols-[1fr_minmax(220px,280px)]">
          {playerEl}
          <ChaptersAside
            chapters={chapters}
            t={t}
            onSeek={seek}
            onChapterNote={onChapterNote}
          />
        </div>
      </div>
    );
  }

  // ─── Layout: theatre — wide player, notes hidden ──────────────
  if (layout === "theatre") {
    return (
      <div ref={containerRef} className="flex flex-col gap-3">
        <LayoutControls layout={layout} onChange={setBoth} />
        <div className="mx-auto w-full max-w-[min(1600px,100%)]">
          {playerEl}
        </div>
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

  // ─── Layout: focus — editor full width, player floats as PiP ──
  if (layout === "focus") {
    return (
      <div
        ref={containerRef}
        className="flex h-[calc(100svh-14rem)] min-h-[520px] flex-col gap-3"
      >
        <LayoutControls layout={layout} onChange={setBoth} />
        <div className="border-border/60 bg-card/40 min-h-0 flex-1 rounded-xl border">
          {notesPane}
        </div>
        <DraggablePip
          titleBar={
            <>
              <span className="text-muted-foreground truncate">
                {videoTitle}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => setBoth("split")}
                  aria-label="Back to split"
                  title="Back to split (Esc)"
                  className="h-5 px-1"
                >
                  <Minimize2 className="size-3" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => setBoth("theatre")}
                  aria-label="Theatre mode"
                  title="Theatre"
                  className="h-5 px-1"
                >
                  <Maximize2 className="size-3" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => setBoth("off")}
                  aria-label="Close PiP"
                  title="Close"
                  className="h-5 px-1"
                >
                  <X className="size-3" />
                </Button>
              </div>
            </>
          }
        >
          {playerEl}
        </DraggablePip>
      </div>
    );
  }

  // ─── Layout: split (default once opted in) ────────────────────
  // We pick orientation at runtime based on viewport width so the
  // ResizablePanelGroup is mounted exactly once (the library forces
  // `display: flex` inline on its root div, which defeats Tailwind's
  // `hidden`/`xl:flex` toggling — so we'd otherwise dual-mount the
  // player). Sizes are passed as `"60%"` strings, NOT `60` — v4 of
  // react-resizable-panels treats bare numbers as PIXELS, not percent.
  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100svh-14rem)] min-h-[520px] flex-col gap-3"
    >
      <LayoutControls layout={layout} onChange={setBoth} />

      <ResizablePanelGroup
        orientation={isWide ? "horizontal" : "vertical"}
        className="min-h-0 flex-1"
      >
        <ResizablePanel
          defaultSize={isWide ? "60%" : "55%"}
          minSize="35%"
          maxSize="80%"
        >
          <div
            className={cn(
              "flex h-full w-full items-start",
              isWide ? "pr-3" : "pb-3",
            )}
          >
            <div className="w-full">{playerEl}</div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={isWide ? "40%" : "45%"} minSize="20%">
          <div
            className={cn(
              "border-border/60 bg-card/40 h-full rounded-xl border",
              isWide ? "ml-3" : "mt-3",
            )}
          >
            {notesPane}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/**
 * Tracks whether the viewport is at the xl breakpoint (1280px) — used
 * to flip the resizable panel group between horizontal (side-by-side)
 * and vertical (stacked) at the same breakpoint Tailwind's `xl:` uses.
 */
function useIsWide(): boolean {
  const [wide, setWide] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => setWide(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return wide;
}

function LayoutControls({
  layout,
  onChange,
  className,
}: {
  layout: Layout;
  onChange: (next: Layout) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card/60 text-muted-foreground sticky top-2 z-30 flex items-center justify-end gap-1 self-end rounded-full border px-2 py-1 text-[10px] shadow-sm backdrop-blur",
        className,
      )}
    >
      <span className="px-1">Layout</span>
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
