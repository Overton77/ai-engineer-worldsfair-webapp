/** One chapter / timestamp segment parsed from a YouTube-style description. */
export type YoutubeChapter = {
  startSeconds: number;
  label: string;
};

const LINE_RE =
  /^\s*(?:[-*•]\s*)?((?:\d{1,2}:)?\d{1,2}:\d{2})\s*(?:[-–—]\s*)?(.+?)\s*$/;

/** Parse `1:23`, `01:23:45` into seconds. */
export function parseTimestampToSeconds(ts: string): number | null {
  const s = ts.trim();
  if (!s) return null;
  const parts = s.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return null;
}

export function formatChapterTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * Pulls timestamp lines from a video description (YouTube chapter lists, etc.).
 * Only lines that start with a timestamp are kept to avoid prose false positives.
 */
export function parseChaptersFromDescription(description: string | null | undefined): YoutubeChapter[] {
  if (!description?.trim()) return [];
  const lines = description.split(/\r?\n/);
  const seen = new Set<number>();
  const out: YoutubeChapter[] = [];

  for (const line of lines) {
    const m = line.match(LINE_RE);
    if (!m) continue;
    const sec = parseTimestampToSeconds(m[1]!);
    if (sec == null || sec < 0) continue;
    const label = m[2]!.trim();
    if (!label) continue;
    if (seen.has(sec)) continue;
    seen.add(sec);
    out.push({ startSeconds: sec, label });
  }

  out.sort((a, b) => a.startSeconds - b.startSeconds);
  return out;
}

/** ISO 8601 duration e.g. PT1H2M3S → seconds */
export function parseIso8601DurationSeconds(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const m = iso.trim().match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return null;
  const h = Number.parseInt(m[1] ?? "0", 10) || 0;
  const min = Number.parseInt(m[2] ?? "0", 10) || 0;
  const s = Number.parseInt(m[3] ?? "0", 10) || 0;
  return h * 3600 + min * 60 + s;
}

export function resolveVideoDurationSeconds(
  durationSeconds: number | null | undefined,
  durationField: string | null | undefined,
  chapters: YoutubeChapter[],
): number {
  if (durationSeconds != null && durationSeconds > 0) {
    return durationSeconds;
  }
  const fromIso = parseIso8601DurationSeconds(durationField ?? null);
  if (fromIso != null && fromIso > 0) return fromIso;
  if (chapters.length) {
    const last = chapters[chapters.length - 1]!;
    return Math.max(last.startSeconds + 60, last.startSeconds + 1);
  }
  return 0;
}
