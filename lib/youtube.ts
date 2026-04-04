/** Resolve a stable id for embedding: prefer API `video_id`, else parse from `url`. */
export function resolveYoutubeVideoId(
  videoId: string | null | undefined,
  url: string | null | undefined,
): string | null {
  const id = videoId?.trim();
  if (id) return id;
  return extractYoutubeVideoIdFromUrl(url);
}

export function youtubeEmbedSrc(videoId: string): string {
  const q = new URLSearchParams({ rel: "0", modestbranding: "1" });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${q}`;
}

export function extractYoutubeVideoIdFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ?? null;
    }

    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1] ?? null;
      const shortIdx = parts.indexOf("shorts");
      if (shortIdx >= 0 && parts[shortIdx + 1]) return parts[shortIdx + 1] ?? null;
      const liveIdx = parts.indexOf("live");
      if (liveIdx >= 0 && parts[liveIdx + 1]) return parts[liveIdx + 1] ?? null;
    }

    return null;
  } catch {
    return null;
  }
}
