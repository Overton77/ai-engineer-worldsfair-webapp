import type { Tables } from "@/types/database.types";

export type Tab = "videos" | "persons" | "organizations" | "sessions";

export type PersonRow = Tables<"person"> & {
  person_employed_by?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    organization?: Tables<"organization"> | null;
  }>;
  person_founded_organization?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    organization?: Tables<"organization"> | null;
  }>;
  organization_has_ceo?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    organization?: Tables<"organization"> | null;
  }>;
  person_presented_at_session?: Array<{
    session?: Tables<"session"> | null;
  }>;
  person_appeared_in_video?: Array<{
    matched_name_variant?: string | null;
    match_method?: string | null;
    youtube_video?: Tables<"youtube_video"> | null;
  }>;
};

export type OrgRow = Tables<"organization"> & {
  person_employed_by?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    person?: Tables<"person"> | null;
  }>;
  person_founded_organization?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    person?: Tables<"person"> | null;
  }>;
  organization_has_ceo?: Array<{
    role_title: string | null;
    confidence?: number | null;
    needs_review?: boolean | null;
    person?: Tables<"person"> | null;
  }>;
};

export type SessionRow = Tables<"session"> & {
  person_presented_at_session?: Array<{ person?: Tables<"person"> | null }>;
  session_recorded_as_video?:
    | Array<{
        match_similarity: number | null;
        youtube_video?: Tables<"youtube_video"> | null;
      }>
    | {
        match_similarity: number | null;
        youtube_video?: Tables<"youtube_video"> | null;
      }
    | null;
};

export type VideoRow = Tables<"youtube_video"> & {
  youtube_channel?: Tables<"youtube_channel"> | null;
  session_recorded_as_video?:
    | Array<{
        match_similarity: number | null;
        session?: Tables<"session"> | null;
      }>
    | {
        match_similarity: number | null;
        session?: Tables<"session"> | null;
      }
    | null;
  person_appeared_in_video?: Array<{
    matched_name_variant?: string | null;
    match_method?: string | null;
    person?: Tables<"person"> | null;
  }>;
};

export type Viewer = {
  email?: string | null;
  id: string;
} | null;

export type SearchPreview = {
  persons: Array<Pick<Tables<"person">, "person_id" | "full_name" | "role_title">>;
  organizations: Array<
    Pick<Tables<"organization">, "organization_id" | "name" | "organization_type">
  >;
  youtube_videos: Array<
    Pick<Tables<"youtube_video">, "video_id" | "title" | "thumbnail_url"> & {
      youtube_channel?: { channel_title: string | null } | null;
    }
  >;
};

export function tabLabel(t: Tab): string {
  switch (t) {
    case "videos":
      return "Videos";
    case "persons":
      return "People";
    case "organizations":
      return "Organizations";
    case "sessions":
      return "Sessions";
    default:
      return t;
  }
}

export function normalizeSessionVideoLink(
  raw: SessionRow["session_recorded_as_video"],
): { match_similarity: number | null; youtube_video?: Tables<"youtube_video"> | null }[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function normalizeVideoSessionLink(
  raw: VideoRow["session_recorded_as_video"],
): { match_similarity: number | null; session?: Tables<"session"> | null }[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function hasPersonDetail(person: PersonRow | null) {
  return !!(
    person?.person_employed_by ||
    person?.person_founded_organization ||
    person?.organization_has_ceo ||
    person?.person_presented_at_session ||
    person?.person_appeared_in_video
  );
}

export function hasOrgDetail(org: OrgRow | null) {
  return !!(
    org?.person_employed_by ||
    org?.person_founded_organization ||
    org?.organization_has_ceo
  );
}

export function hasSessionDetail(session: SessionRow | null) {
  return !!(session?.person_presented_at_session || session?.session_recorded_as_video);
}

export function hasVideoDetail(video: VideoRow | null) {
  return !!(
    video?.youtube_channel ||
    video?.session_recorded_as_video ||
    video?.person_appeared_in_video
  );
}

export function fetchJsonData<T>(url: string): Promise<T> {
  return fetch(url).then(async (response) => {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        typeof body?.error === "string" ? body.error : `${response.status} ${response.statusText}`,
      );
    }
    return (await response.json()) as T;
  });
}

export function pickOrFirst<T, K extends string | number>(
  rows: T[],
  prev: T | null,
  id: (row: T) => K,
): T | null {
  if (!rows.length) return null;
  if (prev) {
    const pid = id(prev);
    const found = rows.find((r) => id(r) === pid);
    if (found) return found;
  }
  return rows[0] ?? null;
}

export function mergeById<T, K extends string | number>(
  prev: T[],
  row: T,
  idFn: (row: T) => K,
): T[] {
  const pid = idFn(row);
  const i = prev.findIndex((r) => idFn(r) === pid);
  if (i >= 0) {
    const next = [...prev];
    next[i] = row;
    return next;
  }
  return [row, ...prev];
}

export const VIDEO_PAGE_SIZE = 12;
export const DIRECTORY_LIST_LIMIT = "120";
