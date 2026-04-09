"use client";

import {
  Clapperboard,
  PlayCircle,
  Presentation,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SessionRow } from "@/components/directory/directory-types";
import { normalizeSessionVideoLink } from "@/components/directory/directory-types";

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 pb-2">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function PresenterChip({
  name,
  onClick,
}: {
  name: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="text-[11px] font-semibold leading-none">
          {(name[0] ?? "?").toUpperCase()}
        </span>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{name}</p>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-border/80 bg-card text-left transition-all hover:border-primary/30 hover:bg-primary/3 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </button>
    );
  }
  return <div className="w-full rounded-xl border border-border/80 bg-card">{inner}</div>;
}

export function SessionDetailPanel({
  session,
  onOpenPerson,
  onOpenVideo,
}: {
  session: SessionRow;
  onOpenPerson: (id: string) => void | Promise<void>;
  onOpenVideo: (id: string) => void | Promise<void>;
}) {
  const links = normalizeSessionVideoLink(session.session_recorded_as_video);
  const video = links[0]?.youtube_video;
  const presenters = session.person_presented_at_session ?? [];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-violet-500/10 text-violet-600 shadow-sm dark:text-violet-400">
          <Presentation className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-xl font-semibold leading-tight text-foreground">
            {session.title ?? session.session_id}
          </h2>
          {session.level ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {session.level}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Recording CTA ── */}
      {video ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <Clapperboard className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium text-foreground">{video.title ?? "Recording available"}</p>
            <p className="text-xs text-muted-foreground">YouTube recording</p>
          </div>
          <Button
            type="button"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => void onOpenVideo(video.video_id)}
          >
            <PlayCircle className="size-3.5" />
            Watch
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <Clapperboard className="size-4 shrink-0" aria-hidden />
          No linked YouTube recording for this session.
        </div>
      )}

      {/* ── Description ── */}
      {session.description ? (
        <>
          <Separator />
          <div className="space-y-1">
            <SectionLabel icon={Presentation} label="Description" />
            <p className="text-sm leading-relaxed text-foreground/90">{session.description}</p>
          </div>
        </>
      ) : null}

      {/* ── Extended description ── */}
      {session.extended_description ? (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {session.extended_description}
        </div>
      ) : null}

      {/* ── Presenters ── */}
      {presenters.length > 0 ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Users} label="Presenters" />
            <div className="grid gap-2 sm:grid-cols-2">
              {presenters.map((row, i) => {
                const pid = row.person?.person_id;
                return (
                  <PresenterChip
                    key={i}
                    name={row.person?.full_name ?? "Speaker"}
                    onClick={pid ? () => void onOpenPerson(pid) : undefined}
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
