/** Slider / API bounds for YouTube video duration filter. */
export const YOUTUBE_VIDEO_FILTER_BOUNDS = {
  durationSec: { min: 0, max: 6 * 3600 },
} as const;

export type YoutubeVideoFilterState = {
  minDurationSec: number;
  maxDurationSec: number;
};

export const DEFAULT_YOUTUBE_VIDEO_FILTERS: YoutubeVideoFilterState = {
  minDurationSec: YOUTUBE_VIDEO_FILTER_BOUNDS.durationSec.min,
  maxDurationSec: YOUTUBE_VIDEO_FILTER_BOUNDS.durationSec.max,
};

function parseOptionalNonNegInt(raw: string | null): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export type ParsedYoutubeVideoFilters = {
  min_views?: number;
  max_views?: number;
  min_likes?: number;
  max_likes?: number;
  min_duration_sec?: number;
  max_duration_sec?: number;
};

export function parseYoutubeVideoFiltersFromSearchParams(
  searchParams: URLSearchParams,
): ParsedYoutubeVideoFilters {
  const min_views = parseOptionalNonNegInt(searchParams.get("min_views"));
  const max_views = parseOptionalNonNegInt(searchParams.get("max_views"));
  const min_likes = parseOptionalNonNegInt(searchParams.get("min_likes"));
  const max_likes = parseOptionalNonNegInt(searchParams.get("max_likes"));
  const min_duration_sec = parseOptionalNonNegInt(searchParams.get("min_duration_sec"));
  const max_duration_sec = parseOptionalNonNegInt(searchParams.get("max_duration_sec"));

  const out: ParsedYoutubeVideoFilters = {};
  if (min_views !== undefined) out.min_views = min_views;
  if (max_views !== undefined) out.max_views = max_views;
  if (min_likes !== undefined) out.min_likes = min_likes;
  if (max_likes !== undefined) out.max_likes = max_likes;
  if (min_duration_sec !== undefined) out.min_duration_sec = min_duration_sec;
  if (max_duration_sec !== undefined) out.max_duration_sec = max_duration_sec;

  if (
    out.min_views != null &&
    out.max_views != null &&
    out.min_views > out.max_views
  ) {
    const t = out.min_views;
    out.min_views = out.max_views;
    out.max_views = t;
  }
  if (out.min_likes != null && out.max_likes != null && out.min_likes > out.max_likes) {
    const t = out.min_likes;
    out.min_likes = out.max_likes;
    out.max_likes = t;
  }
  if (
    out.min_duration_sec != null &&
    out.max_duration_sec != null &&
    out.min_duration_sec > out.max_duration_sec
  ) {
    const t = out.min_duration_sec;
    out.min_duration_sec = out.max_duration_sec;
    out.max_duration_sec = t;
  }

  return out;
}

/** Append only bounds that differ from defaults so the API applies a real constraint. */
export function appendYoutubeVideoFilterParams(
  params: URLSearchParams,
  f: YoutubeVideoFilterState,
): void {
  const b = YOUTUBE_VIDEO_FILTER_BOUNDS;
  if (f.minDurationSec > b.durationSec.min) params.set("min_duration_sec", String(f.minDurationSec));
  if (f.maxDurationSec < b.durationSec.max) params.set("max_duration_sec", String(f.maxDurationSec));
}

export function formatFilterDuration(sec: number): string {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (sec >= 60) return `${Math.floor(sec / 60)}m`;
  return `${sec}s`;
}
