import Image from "next/image";
import Link from "next/link";
import { Clapperboard, ExternalLink, Globe, Landmark, Presentation, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";

type Person = Tables<"person"> & {
  person_employed_by?: unknown;
  person_presented_at_session?: unknown;
  person_appeared_in_video?: unknown;
};
type Organization = Tables<"organization">;
type Session = Tables<"session">;
type YoutubeVideo = Tables<"youtube_video"> & {
  youtube_channel?: Tables<"youtube_channel"> | null;
};

export function PersonCard({
  person,
  active,
  onSelect,
}: {
  person: Person;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "py-0 transition-all hover:shadow-md hover:ring-2 hover:ring-ring/30",
        active && "ring-2 ring-primary shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col text-left outline-none"
      >
        <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-3 pb-2">
          {person.sessionize_profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.sessionize_profile_picture_url}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-5" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5">
            <CardTitle className="truncate text-sm leading-tight">
              {person.full_name ?? person.person_id}
            </CardTitle>
            {person.role_title ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{person.role_title}</p>
            ) : null}
            {person.linkedin_url ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary">
                <ExternalLink className="size-2.5" />
                LinkedIn
              </span>
            ) : null}
          </div>
        </CardHeader>
      </button>
    </Card>
  );
}

export function OrganizationCard({
  org,
  active,
  onSelect,
}: {
  org: Organization;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "py-0 transition-all hover:shadow-md hover:ring-2 hover:ring-ring/30",
        active && "ring-2 ring-primary shadow-sm",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full flex-col text-left outline-none">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <CardTitle className="text-sm">{org.name ?? org.organization_id}</CardTitle>
                {org.organization_type ? (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {org.organization_type}
                  </Badge>
                ) : null}
              </div>
              {org.website_domain ? (
                <p className="flex items-center gap-1 truncate text-xs text-primary">
                  <Globe className="size-2.5 shrink-0" />
                  {org.website_domain}
                </p>
              ) : null}
              {org.primary_ai_focus ? (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{org.primary_ai_focus}</p>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </button>
    </Card>
  );
}

export function SessionCard({
  session,
  active,
  onSelect,
}: {
  session: Session;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "py-0 transition-all hover:shadow-md hover:ring-2 hover:ring-ring/30",
        active && "ring-2 ring-primary shadow-sm",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full flex-col text-left outline-none">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Presentation className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="line-clamp-2 text-sm leading-snug">
                {session.title ?? session.session_id}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {session.level ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {session.level}
                  </Badge>
                ) : null}
              </div>
              {session.description ? (
                <p className="line-clamp-1 text-[11px] text-muted-foreground">
                  {session.description}
                </p>
              ) : null}
            </div>
          </div>
        </CardHeader>
      </button>
    </Card>
  );
}

export function VideoCard({
  video,
  active,
  onSelect,
  compact = false,
  href,
}: {
  video: YoutubeVideo;
  /** When set, the card navigates as a link (onSelect / active ignored). */
  href?: string;
  active?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}) {
  const body = (
    <>
      <div className="relative aspect-video w-full bg-muted">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt=""
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes={compact ? "(max-width: 768px) 50vw, 180px" : "(max-width: 768px) 100vw, 33vw"}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Clapperboard className="size-6 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
        {video.duration ? (
          <span
            className={cn(
              "absolute right-1.5 top-1.5 rounded bg-black/70 px-1 font-mono text-white",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            {video.duration}
          </span>
        ) : null}
        <p
          className={cn(
            "absolute left-2 right-2 text-left font-medium text-white drop-shadow",
            compact
              ? "bottom-1.5 line-clamp-1 text-[10px] leading-tight"
              : "bottom-2 line-clamp-2 text-xs",
          )}
        >
          {video.title ?? video.video_id}
        </p>
      </div>
      <CardFooter
        className={cn(
          "flex flex-row items-center justify-between gap-2 border-t",
          compact ? "py-1.5" : "py-2",
        )}
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5 truncate text-muted-foreground",
            compact ? "text-[10px]" : "text-[11px]",
          )}
        >
          <Clapperboard className={cn("shrink-0 text-muted-foreground", compact ? "size-2.5" : "size-3")} aria-hidden />
          {video.youtube_channel?.channel_title ?? "YouTube"}
        </span>
        {video.published_at ? (
          <span
            className={cn(
              "shrink-0 tabular-nums text-muted-foreground",
              compact ? "text-[9px]" : "text-[10px]",
            )}
          >
            {new Date(video.published_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
          </span>
        ) : null}
      </CardFooter>
    </>
  );

  return (
    <Card
      size="sm"
      className={cn(
        "overflow-hidden py-0 transition-all hover:shadow-md hover:ring-2 hover:ring-ring/30",
        !href && active && "ring-2 ring-primary shadow-sm",
      )}
    >
      {href ? (
        <Link href={href} className="flex w-full flex-col text-left outline-none">
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onSelect} className="flex w-full flex-col text-left outline-none">
          {body}
        </button>
      )}
    </Card>
  );
}
