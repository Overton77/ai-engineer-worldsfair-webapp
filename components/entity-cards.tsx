import Image from "next/image";

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
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-3 rounded-xl border p-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/80 ${
        active
          ? "border-amber-500 ring-2 ring-amber-500/30 dark:border-amber-400"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {person.sessionize_profile_picture_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external CDNs
        <img
          src={person.sessionize_profile_picture_url}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {(person.first_name?.[0] ?? person.full_name?.[0] ?? "?").toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
          {person.full_name ?? person.person_id}
        </p>
        {person.role_title ? (
          <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">{person.role_title}</p>
        ) : null}
      </div>
    </button>
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
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/80 ${
        active
          ? "border-amber-500 ring-2 ring-amber-500/30 dark:border-amber-400"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{org.name ?? org.organization_id}</p>
      {org.organization_type ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{org.organization_type}</p>
      ) : null}
      {org.website_domain ? (
        <p className="truncate text-xs text-amber-700 dark:text-amber-300">{org.website_domain}</p>
      ) : null}
    </button>
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
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/80 ${
        active
          ? "border-amber-500 ring-2 ring-amber-500/30 dark:border-amber-400"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <p className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-50">
        {session.title ?? session.session_id}
      </p>
      {session.level ? (
        <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {session.level}
        </span>
      ) : null}
    </button>
  );
}

export function VideoCard({
  video,
  active,
  onSelect,
}: {
  video: YoutubeVideo;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-xl border text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${
        active
          ? "border-amber-500 ring-2 ring-amber-500/30 dark:border-amber-400"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="relative aspect-video w-full bg-zinc-900">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">No thumbnail</div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
        <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-sm font-medium text-white drop-shadow">
          {video.title ?? video.video_id}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          {video.youtube_channel?.channel_title ?? "YouTube"}
        </span>
        {video.published_at ? (
          <span className="shrink-0 text-[10px] text-zinc-500">
            {new Date(video.published_at).toLocaleDateString()}
          </span>
        ) : null}
      </div>
    </button>
  );
}
