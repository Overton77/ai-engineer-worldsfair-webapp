import Image from "next/image";
import { Clapperboard, Landmark, Presentation, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
        "py-0 transition-shadow hover:ring-2 hover:ring-ring/40",
        active && "ring-2 ring-primary",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col text-left outline-none"
      >
        <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-3 pb-2">
          {person.sessionize_profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external CDNs
            <img
              src={person.sessionize_profile_picture_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
        "py-0 transition-shadow hover:ring-2 hover:ring-ring/40",
        active && "ring-2 ring-primary",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full flex-col text-left outline-none">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <Landmark className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <CardTitle className="text-sm">{org.name ?? org.organization_id}</CardTitle>
            {org.organization_type ? (
              <Badge variant="outline" className="text-[10px] font-normal">
                {org.organization_type}
              </Badge>
            ) : null}
          </div>
          {org.website_domain ? (
            <p className="truncate text-xs text-primary">{org.website_domain}</p>
          ) : null}
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
        "py-0 transition-shadow hover:ring-2 hover:ring-ring/40",
        active && "ring-2 ring-primary",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full flex-col text-left outline-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex gap-2 text-sm leading-snug">
            <Presentation className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="line-clamp-2">{session.title ?? session.session_id}</span>
          </CardTitle>
          {session.level ? (
            <Badge variant="secondary" className="w-fit text-[10px]">
              {session.level}
            </Badge>
          ) : null}
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
}: {
  video: YoutubeVideo;
  active: boolean;
  onSelect: () => void;
  /** Smaller typography and footer — for dense grids under the main player. */
  compact?: boolean;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "overflow-hidden py-0 transition-shadow hover:ring-2 hover:ring-ring/40",
        active && "ring-2 ring-primary",
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full flex-col text-left outline-none">
        <div className="relative aspect-video w-full bg-muted">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt=""
              fill
              className="object-cover"
              sizes={compact ? "(max-width: 768px) 50vw, 180px" : "(max-width: 768px) 100vw, 33vw"}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-transparent to-transparent" />
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
            <span className={cn("shrink-0 text-muted-foreground", compact ? "text-[9px]" : "text-[10px]")}>
              {new Date(video.published_at).toLocaleDateString()}
            </span>
          ) : null}
        </CardFooter>
      </button>
    </Card>
  );
}
