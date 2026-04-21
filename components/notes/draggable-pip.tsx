"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Pos = { x: number; y: number; w: number };

const STORAGE_KEY = "aie:pip-pos:v1";
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 220;
const MAX_WIDTH = 560;
const ASPECT = 9 / 16; // height = width * ASPECT
const EDGE_PADDING = 8;
const TITLEBAR_HEIGHT = 28;

function readStored(): Pos | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Pos>;
    if (
      typeof parsed.x === "number" &&
      typeof parsed.y === "number" &&
      typeof parsed.w === "number"
    ) {
      return { x: parsed.x, y: parsed.y, w: parsed.w };
    }
  } catch {
    // ignore
  }
  return null;
}

function defaultPos(): Pos {
  if (typeof window === "undefined") {
    return { x: 16, y: 16, w: DEFAULT_WIDTH };
  }
  // Top-right by default per wireframe §N3.c
  const w = DEFAULT_WIDTH;
  return {
    x: Math.max(EDGE_PADDING, window.innerWidth - w - 16),
    y: 80,
    w,
  };
}

function clampToViewport(p: Pos): Pos {
  if (typeof window === "undefined") return p;
  const w = Math.min(Math.max(p.w, MIN_WIDTH), MAX_WIDTH);
  const totalH = w * ASPECT + TITLEBAR_HEIGHT;
  const maxX = Math.max(EDGE_PADDING, window.innerWidth - w - EDGE_PADDING);
  const maxY = Math.max(EDGE_PADDING, window.innerHeight - totalH - EDGE_PADDING);
  return {
    x: Math.min(Math.max(p.x, EDGE_PADDING), maxX),
    y: Math.min(Math.max(p.y, EDGE_PADDING), maxY),
    w,
  };
}

type DraggablePipProps = {
  /** The video player. Renders edge-to-edge above the title bar. */
  children: React.ReactNode;
  /** Title bar contents (label on the left, actions on the right). */
  titleBar: React.ReactNode;
  className?: string;
};

/**
 * A floating, draggable, edge-resizable PiP container used by
 * VideoNotesShell focus mode. Position + width persist to
 * localStorage so the user's preferred PiP layout sticks across
 * sessions. Drag from the title bar; resize from the bottom-right
 * corner. Aspect ratio is locked 16:9 to match the player.
 */
export function DraggablePip({ children, titleBar, className }: DraggablePipProps) {
  const [pos, setPos] = React.useState<Pos>(() => defaultPos());
  const [hydrated, setHydrated] = React.useState(false);
  const dragStateRef = React.useRef<{
    mode: "drag" | "resize";
    startX: number;
    startY: number;
    origin: Pos;
  } | null>(null);

  React.useEffect(() => {
    const stored = readStored();
    setPos(clampToViewport(stored ?? defaultPos()));
    setHydrated(true);
    const onResize = () => setPos((p) => clampToViewport(p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [pos, hydrated]);

  const startDrag = (mode: "drag" | "resize") => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragStateRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...pos },
    };
    document.body.style.userSelect = "none";
    const onMove = (ev: PointerEvent) => {
      const s = dragStateRef.current;
      if (!s) return;
      const dx = ev.clientX - s.startX;
      const dy = ev.clientY - s.startY;
      if (s.mode === "drag") {
        setPos(
          clampToViewport({
            x: s.origin.x + dx,
            y: s.origin.y + dy,
            w: s.origin.w,
          }),
        );
      } else {
        setPos(
          clampToViewport({
            x: s.origin.x,
            y: s.origin.y,
            w: s.origin.w + dx,
          }),
        );
      }
    };
    const onUp = () => {
      dragStateRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.removeProperty("user-select");
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      style={{
        left: pos.x,
        top: pos.y,
        width: pos.w,
        // Hide until hydrated so we don't flash at the SSR default
        // before localStorage tells us the user's last position.
        visibility: hydrated ? "visible" : "hidden",
      }}
      className={cn(
        "border-border/60 bg-background fixed z-40 overflow-hidden rounded-xl border shadow-2xl",
        className,
      )}
      role="dialog"
      aria-label="Floating video player"
    >
      <div
        onPointerDown={startDrag("drag")}
        className="bg-card/80 hover:bg-card flex cursor-grab items-center justify-between gap-2 border-b px-2 py-1 text-xs select-none active:cursor-grabbing"
        style={{ height: TITLEBAR_HEIGHT }}
      >
        {titleBar}
      </div>
      <div className="aspect-video w-full">{children}</div>
      <div
        onPointerDown={startDrag("resize")}
        aria-label="Resize"
        className="hover:bg-foreground/10 absolute right-0 bottom-0 size-3 cursor-se-resize"
        style={{
          background:
            "linear-gradient(135deg, transparent 0 50%, currentColor 50% 60%, transparent 60% 75%, currentColor 75% 85%, transparent 85%)",
          color: "rgba(127,127,127,0.6)",
        }}
      />
    </div>
  );
}
