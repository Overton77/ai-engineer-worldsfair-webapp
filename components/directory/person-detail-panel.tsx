"use client";

import {
  Building2,
  ExternalLink,
  Landmark,
  PlayCircle,
  Presentation,
  User,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PersonRow } from "@/components/directory/directory-types";
import { cn } from "@/lib/utils";

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

function OrgChip({
  name,
  role,
  badge,
  onClick,
}: {
  name: string;
  role?: string | null;
  badge?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Landmark className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight text-foreground">{name}</p>
        {role ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{role}</p>
        ) : null}
      </div>
      {badge ? (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {badge}
        </Badge>
      ) : null}
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
  return (
    <div className="w-full rounded-xl border border-border/80 bg-card">{inner}</div>
  );
}

function SessionChip({
  title,
  onClick,
}: {
  title: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
        <Presentation className="size-3.5" aria-hidden />
      </div>
      <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">{title}</p>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-border/80 bg-card text-left transition-all hover:border-violet-400/40 hover:bg-violet-500/3 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </button>
    );
  }
  return <div className="w-full rounded-xl border border-border/80 bg-card">{inner}</div>;
}

function VideoChip({
  title,
  variant,
  onClick,
}: {
  title: string;
  variant?: string | null;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
        <Video className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{title}</p>
        {variant ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{variant}</p>
        ) : null}
      </div>
      <PlayCircle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-border/80 bg-card text-left transition-all hover:border-red-400/40 hover:bg-red-500/3 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </button>
    );
  }
  return <div className="w-full rounded-xl border border-border/80 bg-card">{inner}</div>;
}

export function PersonDetailPanel({
  person,
  onOpenVideo,
  onOpenOrg,
  onOpenSession,
}: {
  person: PersonRow;
  onOpenVideo: (videoId: string) => void | Promise<void>;
  onOpenOrg: (organizationId: string) => void | Promise<void>;
  onOpenSession: (sessionId: string) => void | Promise<void>;
}) {
  const employments = person.person_employed_by ?? [];
  const founded = person.person_founded_organization ?? [];
  const ceoRoles = person.organization_has_ceo ?? [];
  const sessions = person.person_presented_at_session ?? [];
  const videos = person.person_appeared_in_video ?? [];

  const hasOrgs = employments.length > 0 || founded.length > 0 || ceoRoles.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Profile header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {person.sessionize_profile_picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.sessionize_profile_picture_url}
            alt=""
            className="h-24 w-24 shrink-0 rounded-2xl border border-border object-cover shadow-sm"
            loading="lazy"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary shadow-sm">
            <User className="size-9" aria-hidden />
          </div>
        )}
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-xl font-semibold leading-tight text-foreground">
            {person.full_name ?? person.person_id}
          </h2>
          {person.role_title ? (
            <p className="text-sm text-muted-foreground">{person.role_title}</p>
          ) : null}
          {person.tag_line ? (
            <p className="text-sm italic text-muted-foreground/80">"{person.tag_line}"</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {person.linkedin_url ? (
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 gap-1.5 text-xs")}
              >
                <ExternalLink className="size-3" />
                LinkedIn
              </a>
            ) : null}
            {person.ai_engineer_url ? (
              <a
                href={person.ai_engineer_url}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 gap-1.5 text-xs")}
              >
                <ExternalLink className="size-3" />
                AI Engineer
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Bio ── */}
      {person.bio ? (
        <>
          <Separator />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {person.bio}
          </p>
        </>
      ) : null}

      {/* ── Organizations ── */}
      {hasOrgs ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Building2} label="Organizations" />
            <div className="grid gap-2 sm:grid-cols-2">
              {employments.map((row, i) => {
                const oid = row.organization?.organization_id;
                return (
                  <OrgChip
                    key={`emp-${i}`}
                    name={row.organization?.name ?? "Organization"}
                    role={row.role_title}
                    badge="Employee"
                    onClick={oid ? () => void onOpenOrg(oid) : undefined}
                  />
                );
              })}
              {founded.map((row, i) => {
                const oid = row.organization?.organization_id;
                return (
                  <OrgChip
                    key={`fnd-${i}`}
                    name={row.organization?.name ?? "Organization"}
                    role={row.role_title}
                    badge="Founder"
                    onClick={oid ? () => void onOpenOrg(oid) : undefined}
                  />
                );
              })}
              {ceoRoles.map((row, i) => {
                const oid = row.organization?.organization_id;
                return (
                  <OrgChip
                    key={`ceo-${i}`}
                    name={row.organization?.name ?? "Organization"}
                    role={row.role_title}
                    badge="CEO"
                    onClick={oid ? () => void onOpenOrg(oid) : undefined}
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {/* ── Sessions ── */}
      {sessions.length > 0 ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Presentation} label="Sessions presented" />
            <div className="space-y-2">
              {sessions.map((row, i) => {
                const sid = row.session?.session_id;
                return (
                  <SessionChip
                    key={i}
                    title={row.session?.title ?? "Session"}
                    onClick={sid ? () => void onOpenSession(sid) : undefined}
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {/* ── YouTube appearances ── */}
      {videos.length > 0 ? (
        <>
          <Separator />
          <section>
            <SectionLabel icon={Video} label="YouTube appearances" />
            <div className="space-y-2">
              {videos.map((row, i) => {
                const v = row.youtube_video;
                if (!v) return null;
                return (
                  <VideoChip
                    key={i}
                    title={v.title ?? v.video_id}
                    variant={row.matched_name_variant}
                    onClick={() => void onOpenVideo(v.video_id)}
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
